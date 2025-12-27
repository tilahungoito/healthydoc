import * as tf from '@tensorflow/tfjs';
import { readFile } from 'fs/promises';
import { join } from 'path';

const IMAGE_SIZE = 224;
const CHANNELS = 3;
const MODEL_DIR = join(process.cwd(), 'lib', 'model', 'tfjs-malar-model');
const MODEL_JSON_PATH = join(MODEL_DIR, 'model.json');
type LayerDefinition = {
  class_name: string;
  config: Record<string, any>;
  inbound_nodes?: any;
};

type InboundNodeObject = {
  args?: Array<{
    class_name?: string;
    config?: {
      keras_history?: [string, number?, number?];
    };
  }>;
  kwargs?: Record<string, any>;
};

function normalizeLayerConfig(layer: LayerDefinition) {
  const cfg = layer.config || {};
  if (cfg.dtype && typeof cfg.dtype === 'object') {
    const dtypeName =
      cfg.dtype?.config?.name ||
      cfg.dtype?.name ||
      cfg.dtype?.class_name ||
      'float32';
    cfg.dtype = dtypeName;
  }

  if (
    layer.class_name === 'InputLayer' &&
    !cfg.batch_input_shape &&
    cfg.batch_shape
  ) {
    cfg.batch_input_shape = cfg.batch_shape;
  }

  layer.config = cfg;

  if (!Array.isArray(layer.inbound_nodes)) {
    return;
  }

  const inboundNodes = layer.inbound_nodes;
  const requiresConversion = inboundNodes.some(
    (node: any) => !Array.isArray(node)
  );

  if (!requiresConversion) {
    return;
  }

  const converted = inboundNodes
    .map((node: any) => {
      if (Array.isArray(node)) {
        return node;
      }

      const inboundNode = node as InboundNodeObject;
      const args = inboundNode.args || [];
      const kwargs = inboundNode.kwargs || {};

      const connections = args
        .map((arg) => {
          const history = arg?.config?.keras_history;
          if (
            arg?.class_name === '__keras_tensor__' &&
            Array.isArray(history) &&
            history.length >= 1
          ) {
            const [layerName, nodeIndex = 0, tensorIndex = 0] = history;
            return [layerName, nodeIndex, tensorIndex, kwargs];
          }
          return null;
        })
        .filter(Boolean);

      return connections.length ? [connections] : [];
    })
    .filter((entry: any) => entry !== undefined && entry !== null);

  layer.inbound_nodes = converted;
  (layer as any).inboundNodes = converted;
}

let malariaModel: tf.LayersModel | null = null;
let modelLoadPromise: Promise<tf.LayersModel> | null = null;
let backendInitialized = false;

interface ModelJson {
  format?: string;
  generatedBy?: string;
  convertedBy?: string;
  modelTopology: tf.io.ModelTopology;
  trainingConfig?: tf.io.TrainingConfig;
  weightsManifest: Array<{
    paths: string[];
    weights: tf.io.WeightsManifestEntry[];
  }>;
  userDefinedMetadata?: Record<string, unknown>;
}

const toArrayBuffer = (buffer: Buffer) =>
  buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

async function initBackend() {
  if (backendInitialized) {
    return;
  }

  if (tf.getBackend() !== 'cpu') {
    await tf.setBackend('cpu');
  }
  await tf.ready();
  backendInitialized = true;
}

async function loadModel(): Promise<tf.LayersModel> {
  if (malariaModel) {
    return malariaModel;
  }

  if (!modelLoadPromise) {
    modelLoadPromise = (async () => {
      await initBackend();
      const start = Date.now();
      console.log('[MalariaModel] Loading TFJS model...');

      // Read model.json
      const modelJsonRaw = await readFile(MODEL_JSON_PATH, 'utf-8');
      const modelJson: ModelJson = JSON.parse(modelJsonRaw);

      // Fix InputLayer batch_input_shape issue and inbound_nodes format
      const modelTopology = modelJson.modelTopology as any;
      let fixedInputLayers = 0;
      let fixedInboundNodes = 0;
      
      // Normalize layers from both possible locations
      const layers = modelTopology?.model_config?.layers || 
                     modelTopology?.model_config?.config?.layers || 
                     [];
      
      if (layers.length > 0) {
        layers.forEach((layer: any) => {
          // Fix InputLayer batch_input_shape
          if (layer.class_name === 'InputLayer' && layer.config) {
            const cfg = layer.config;
            if (!cfg.batch_input_shape && cfg.batch_shape) {
              cfg.batch_input_shape = cfg.batch_shape;
              fixedInputLayers++;
            }
            if (!cfg.batch_input_shape && !cfg.input_shape) {
              if (cfg.batch_shape && Array.isArray(cfg.batch_shape)) {
                cfg.batch_input_shape = cfg.batch_shape;
                fixedInputLayers++;
              }
            }
          }
          
          // Fix inbound_nodes format (convert objects to arrays)
          // Check both snake_case and camelCase
          const inboundNodesKey = layer.inbound_nodes ? 'inbound_nodes' : 
                                   layer.inboundNodes ? 'inboundNodes' : null;
          
          if (inboundNodesKey) {
            const nodes = layer[inboundNodesKey];
            if (nodes && Array.isArray(nodes)) {
              const requiresConversion = nodes.some(
                (node: any) => !Array.isArray(node)
              );
              if (requiresConversion) {
                const converted = nodes.map((node: any) => {
                  if (Array.isArray(node)) return node;
                  // Convert object format to array format
                  const inboundNode = node || {};
                  const args = inboundNode.args || [];
                  const kwargs = inboundNode.kwargs || {};
                  const connections = args
                    .map((arg: any) => {
                      const history = arg?.config?.keras_history;
                      if (
                        arg?.class_name === '__keras_tensor__' &&
                        Array.isArray(history) &&
                        history.length >= 1
                      ) {
                        const [layerName, nodeIndex = 0, tensorIndex = 0] = history;
                        return [layerName, nodeIndex, tensorIndex, kwargs];
                      }
                      return null;
                    })
                    .filter(Boolean);
                  return connections.length ? [connections] : [];
                }).filter((entry: any) => Array.isArray(entry) && entry.length > 0);
                
                // Set both snake_case and camelCase
                layer.inbound_nodes = converted;
                layer.inboundNodes = converted;
                fixedInboundNodes++;
              } else {
                // Ensure both versions exist
                if (inboundNodesKey === 'inbound_nodes') {
                  layer.inboundNodes = nodes;
                } else {
                  layer.inbound_nodes = nodes;
                }
              }
            }
          }
        });
        
        // Ensure layers are set in both locations
        if (modelTopology?.model_config) {
          if (!modelTopology.model_config.layers) {
            modelTopology.model_config.layers = layers;
          }
          if (modelTopology.model_config.config && !modelTopology.model_config.config.layers) {
            modelTopology.model_config.config.layers = layers;
          }
        }
        
        if (fixedInputLayers > 0 || fixedInboundNodes > 0) {
          console.log(
            `[MalariaModel] Fixed ${fixedInputLayers} InputLayer(s) and ${fixedInboundNodes} inbound_nodes`
          );
        }
      }

      // Read all weight files
      console.log('[MalariaModel] Reading TFJS weights...');
      const weightBuffers: ArrayBuffer[] = [];
      for (const group of modelJson.weightsManifest) {
        for (const relPath of group.paths) {
          const weightPath = join(MODEL_DIR, relPath);
          const fileBuffer = await readFile(weightPath);
          weightBuffers.push(toArrayBuffer(fileBuffer));
        }
      }

      const totalBytes = weightBuffers.reduce(
        (sum, buffer) => sum + buffer.byteLength,
        0
      );
      console.log(
        `[MalariaModel] Loaded ${(totalBytes / (1024 * 1024)).toFixed(2)} MB of weights`
      );

      // Merge weight buffers
      const mergedBuffer = new Uint8Array(totalBytes);
      let offset = 0;
      for (const buffer of weightBuffers) {
        mergedBuffer.set(new Uint8Array(buffer), offset);
        offset += buffer.byteLength;
      }

      // Final validation: ensure all layers have proper inboundNodes format
      const finalLayers = modelTopology?.model_config?.layers || 
                          modelTopology?.model_config?.config?.layers || 
                          [];
      if (finalLayers.length > 0) {
        finalLayers.forEach((layer: any, idx: number) => {
          // Ensure inboundNodes exists and is an array
          const nodes = layer.inboundNodes || layer.inbound_nodes;
          if (nodes && !Array.isArray(nodes)) {
            console.warn(`[MalariaModel] Layer ${idx} (${layer.name}) has non-array inboundNodes, fixing...`);
            layer.inboundNodes = [];
            layer.inbound_nodes = [];
          } else if (nodes && Array.isArray(nodes)) {
            // Validate each node is an array
            const invalidNodes = nodes.filter((n: any) => !Array.isArray(n));
            if (invalidNodes.length > 0) {
              console.warn(`[MalariaModel] Layer ${idx} (${layer.name}) has ${invalidNodes.length} invalid nodes, removing...`);
              layer.inboundNodes = nodes.filter((n: any) => Array.isArray(n));
              layer.inbound_nodes = layer.inboundNodes;
            }
          }
        });
      }

      // Ensure model_config structure is properly flattened for TFJS
      const modelConfig = modelTopology?.model_config;
      if (modelConfig) {
        // Flatten config structure - TFJS expects layers at top level
        if (modelConfig.config && !modelConfig.layers) {
          modelConfig.layers = modelConfig.config.layers;
        }
        if (modelConfig.config && !modelConfig.inputLayers) {
          modelConfig.inputLayers = modelConfig.config.input_layers || modelConfig.config.inputLayers;
        }
        if (modelConfig.config && !modelConfig.outputLayers) {
          modelConfig.outputLayers = modelConfig.config.output_layers || modelConfig.config.outputLayers;
        }
      }

      // Create IO handler with fully normalized topology
      console.log('[MalariaModel] Creating IO handler...');
      const handler: tf.io.IOHandler = {
        load: async () => {
          console.log('[MalariaModel] IO handler called, returning model data...');
          return {
            modelTopology: modelJson.modelTopology,
            format: modelJson.format,
            generatedBy: modelJson.generatedBy,
            convertedBy: modelJson.convertedBy,
            trainingConfig: modelJson.trainingConfig,
            userDefinedMetadata: modelJson.userDefinedMetadata,
            weightSpecs: modelJson.weightsManifest.flatMap(
              (group) => group.weights
            ),
            weightData: mergedBuffer.buffer,
          };
        },
      };

      // Load model with timeout and progress tracking
      console.log('[MalariaModel] Calling tf.loadLayersModel...');
      
      // Add progress logging
      const progressInterval = setInterval(() => {
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`[MalariaModel] Still loading... (${elapsed}s elapsed)`);
      }, 10000); // Log every 10 seconds
      
      try {
        malariaModel = await Promise.race([
          tf.loadLayersModel(handler).then((model) => {
            clearInterval(progressInterval);
            console.log('[MalariaModel] tf.loadLayersModel completed');
            return model;
          }),
          new Promise<never>((_, reject) => {
            setTimeout(() => {
              clearInterval(progressInterval);
              reject(new Error('Model loading timeout after 60s. The Keras 3.x model structure may be incompatible with TFJS 4.x. Recommendation: Use a Python microservice for inference (Flask/FastAPI) that loads the .h5 model directly.'));
            }, 60000);
          })
        ]);
        const loadTime = ((Date.now() - start) / 1000).toFixed(2);
        console.log(`[MalariaModel] Model loaded successfully in ${loadTime}s`);
      } catch (error: any) {
        clearInterval(progressInterval);
        console.error('[MalariaModel] Failed to load model:', error.message);
        if (error.stack) {
          console.error('[MalariaModel] Stack trace:', error.stack);
        }
        throw error;
      }

      return malariaModel;
    })();
  }

  return modelLoadPromise;
}

export interface MalariaPrediction {
  parasitizedProbability: number;
  uninfectedProbability: number;
}

export async function predictMalaria(
  normalizedPixels: Float32Array
): Promise<MalariaPrediction> {
  const model = await loadModel();
  const start = Date.now();

  const prediction = tf.tidy(() => {
    const inputTensor = tf.tensor4d(
      normalizedPixels,
      [1, IMAGE_SIZE, IMAGE_SIZE, CHANNELS]
    );
    return model.predict(inputTensor) as tf.Tensor;
  });

  const probabilities = await prediction.data();
  prediction.dispose();
  console.log(
    `[MalariaModel] Inference completed in ${(
      (Date.now() - start) /
      1000
    ).toFixed(2)}s`
  );

  const parasitized = probabilities[0] ?? 0;
  const uninfected = probabilities[1] ?? Math.max(0, 1 - parasitized);

  return {
    parasitizedProbability: parasitized,
    uninfectedProbability: uninfected,
  };
}

export const MALARIA_IMAGE_SIZE = IMAGE_SIZE;
export const MALARIA_CHANNELS = CHANNELS;

