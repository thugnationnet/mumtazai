import React from 'react';
import ToolExecutionPanel, { ToolDefinition } from './ToolExecutionPanel';
import { PreviewContent } from './PanelPreview';

const TOOLS: ToolDefinition[] = [
  {
    id: 'image_create',
    icon: '🎨',
    label: 'Create Image',
    desc: 'Create blank canvases, gradients, solid colors, patterns, or placeholder images with custom dimensions.',
    color: 'violet',
    fields: [
      { key: 'type', type: 'select', label: 'Image Type', options: ['blank','gradient','solid','pattern','placeholder','noise','checkerboard'], default: 'solid', required: true },
      { key: 'width', type: 'number', label: 'Width (px)', placeholder: '1920', default: 1920, required: true },
      { key: 'height', type: 'number', label: 'Height (px)', placeholder: '1080', default: 1080, required: true },
      { key: 'color', type: 'color', label: 'Primary Color', default: '#3B82F6' },
      { key: 'color2', type: 'color', label: 'Secondary Color (for gradients)', default: '#8B5CF6' },
      { key: 'text', type: 'text', label: 'Text Overlay', placeholder: 'Placeholder text' },
      { key: 'format', type: 'select', label: 'Output Format', options: ['png','jpeg','webp','svg'], default: 'png' },
    ],
    buildInput: (v) => ({ type: v.type, width: Number(v.width), height: Number(v.height), color: v.color, color2: v.color2, text: v.text, format: v.format }),
  },
  {
    id: 'image_transform',
    icon: '🔄',
    label: 'Transform',
    desc: 'Resize, crop, rotate, flip, mirror, skew, or perspective-transform images.',
    color: 'blue',
    fields: [
      { key: 'input', type: 'text', label: 'Input Image', placeholder: './image.png', required: true },
      { key: 'operation', type: 'select', label: 'Operation', options: ['resize','crop','rotate','flip_h','flip_v','skew','perspective','pad','extend'], default: 'resize', required: true },
      { key: 'width', type: 'number', label: 'Width (for resize/crop)', placeholder: '800' },
      { key: 'height', type: 'number', label: 'Height (for resize/crop)', placeholder: '600' },
      { key: 'angle', type: 'number', label: 'Angle (for rotate)', placeholder: '90' },
      { key: 'fit', type: 'select', label: 'Fit Mode (for resize)', options: ['cover','contain','fill','inside','outside'], default: 'cover' },
      { key: 'output', type: 'text', label: 'Output File', placeholder: './transformed.png' },
    ],
    buildInput: (v) => ({ input: v.input, operation: v.operation, width: v.width ? Number(v.width) : undefined, height: v.height ? Number(v.height) : undefined, angle: v.angle ? Number(v.angle) : undefined, fit: v.fit, output: v.output }),
  },
  {
    id: 'image_convert',
    icon: '💱',
    label: 'Convert Format',
    desc: 'Convert between image formats: PNG, JPEG, WebP, AVIF, TIFF, GIF, SVG, ICO, BMP.',
    color: 'emerald',
    fields: [
      { key: 'input', type: 'text', label: 'Input Image', placeholder: './image.png', required: true },
      { key: 'format', type: 'select', label: 'Output Format', options: ['png','jpeg','webp','avif','tiff','gif','svg','ico','bmp','pdf'], default: 'webp', required: true },
      { key: 'quality', type: 'range', label: 'Quality', min: 1, max: 100, default: 85 },
      { key: 'output', type: 'text', label: 'Output File', placeholder: './output.webp' },
    ],
    buildInput: (v) => ({ input: v.input, format: v.format, quality: Number(v.quality), output: v.output }),
  },
  {
    id: 'image_compose',
    icon: '🖼️',
    label: 'Compose / Collage',
    desc: 'Composite images: overlay, blend, collage, montage, side-by-side, grid layout.',
    color: 'pink',
    fields: [
      { key: 'images', type: 'textarea', label: 'Image Paths (one per line)', placeholder: './img1.png\n./img2.png\n./img3.png', required: true },
      { key: 'layout', type: 'select', label: 'Layout', options: ['overlay','side_by_side','grid','vertical','horizontal','diagonal','mosaic'], default: 'grid' },
      { key: 'width', type: 'number', label: 'Canvas Width', placeholder: '1920' },
      { key: 'height', type: 'number', label: 'Canvas Height', placeholder: '1080' },
      { key: 'gap', type: 'number', label: 'Gap (px)', placeholder: '10', default: 10 },
      { key: 'background', type: 'color', label: 'Background Color', default: '#000000' },
      { key: 'output', type: 'text', label: 'Output File', placeholder: './collage.png' },
    ],
    buildInput: (v) => ({ images: v.images?.split('\n').filter(Boolean), layout: v.layout, width: v.width ? Number(v.width) : undefined, height: v.height ? Number(v.height) : undefined, gap: Number(v.gap), background: v.background, output: v.output }),
  },
  {
    id: 'image_filter',
    icon: '🌈',
    label: 'Apply Filter',
    desc: 'Apply filters: blur, sharpen, grayscale, sepia, invert, brightness, contrast, saturation, tint.',
    color: 'amber',
    fields: [
      { key: 'input', type: 'text', label: 'Input Image', placeholder: './image.png', required: true },
      { key: 'filter', type: 'select', label: 'Filter', options: ['blur','sharpen','grayscale','sepia','invert','brightness','contrast','saturation','tint','emboss','edge_detect','median','threshold','gamma','normalize'], default: 'blur', required: true },
      { key: 'intensity', type: 'range', label: 'Intensity', min: 0, max: 100, default: 50 },
      { key: 'color', type: 'color', label: 'Tint Color (for tint filter)', default: '#FF6B6B' },
      { key: 'output', type: 'text', label: 'Output File', placeholder: './filtered.png' },
    ],
    buildInput: (v) => ({ input: v.input, filter: v.filter, intensity: Number(v.intensity), color: v.color, output: v.output }),
  },
  {
    id: 'image_analyze',
    icon: '🔬',
    label: 'Analyze Image',
    desc: 'Get image metadata, color palette, histogram, EXIF data, dimensions, dominant colors, similarity.',
    color: 'cyan',
    fields: [
      { key: 'input', type: 'text', label: 'Image File', placeholder: './image.png', required: true },
      { key: 'analysis', type: 'select', label: 'Analysis Type', options: ['metadata','colors','histogram','exif','dimensions','palette','similarity','quality'], default: 'metadata' },
      { key: 'compare', type: 'text', label: 'Compare With (for similarity)', placeholder: './other-image.png' },
      { key: 'format', type: 'select', label: 'Output Format', options: ['json','text','html','table'], default: 'json' },
    ],
    buildInput: (v) => ({ input: v.input, analysis: v.analysis, compare: v.compare, format: v.format }),
  },
  {
    id: 'image_background',
    icon: '✂️',
    label: 'Background Remove',
    desc: 'Remove or replace image backgrounds using AI. Transparent PNG, custom background, blur.',
    color: 'red',
    fields: [
      { key: 'input', type: 'text', label: 'Input Image', placeholder: './photo.jpg', required: true },
      { key: 'operation', type: 'select', label: 'Operation', options: ['remove','replace','blur','gradient'], default: 'remove' },
      { key: 'background', type: 'text', label: 'Replacement (color, image path, or gradient)', placeholder: '#FFFFFF or ./bg.jpg' },
      { key: 'blur_amount', type: 'range', label: 'Blur Amount (for blur mode)', min: 1, max: 50, default: 10 },
      { key: 'output', type: 'text', label: 'Output File', placeholder: './no-bg.png' },
    ],
    buildInput: (v) => ({ input: v.input, operation: v.operation, background: v.background, blur_amount: Number(v.blur_amount), output: v.output }),
  },
  {
    id: 'image_ocr',
    icon: '📖',
    label: 'OCR (Text Extract)',
    desc: 'Extract text from images using Tesseract OCR. Supports multiple languages and handwriting.',
    color: 'orange',
    fields: [
      { key: 'input', type: 'text', label: 'Image File', placeholder: './document.png', required: true },
      { key: 'language', type: 'select', label: 'Language', options: ['eng','spa','fra','deu','jpn','kor','chi_sim','chi_tra','ara','hin','auto'], default: 'eng' },
      { key: 'mode', type: 'select', label: 'OCR Mode', options: ['auto','print','handwriting','sparse','table','block'], default: 'auto' },
      { key: 'format', type: 'select', label: 'Output Format', options: ['text','json','hocr','tsv','pdf'], default: 'text' },
    ],
    buildInput: (v) => ({ input: v.input, language: v.language, mode: v.mode, format: v.format }),
  },
  {
    id: 'image_ai',
    icon: '🤖',
    label: 'AI Image Analysis',
    desc: 'AI-powered image analysis: object detection, classification, captioning, visual Q&A.',
    color: 'purple',
    fields: [
      { key: 'input', type: 'text', label: 'Image File', placeholder: './image.jpg', required: true },
      { key: 'task', type: 'select', label: 'AI Task', options: ['describe','objects','classify','caption','question','faces','text','landmarks','nsfw','emotions'], default: 'describe', required: true },
      { key: 'question', type: 'text', label: 'Question (for Q&A task)', placeholder: 'What color is the car?' },
      { key: 'model', type: 'select', label: 'AI Model', options: ['auto','gpt-4-vision','gemini-pro-vision','claude-3'], default: 'auto' },
    ],
    buildInput: (v) => ({ input: v.input, task: v.task, question: v.question, model: v.model }),
  },
  {
    id: 'image_face',
    icon: '👤',
    label: 'Face Operations',
    desc: 'Face detection, recognition, blur, swap, landmark detection, age/gender estimation.',
    color: 'sky',
    fields: [
      { key: 'input', type: 'text', label: 'Image File', placeholder: './photo.jpg', required: true },
      { key: 'operation', type: 'select', label: 'Operation', options: ['detect','blur','landmarks','age_gender','crop','compare','mosaic'], default: 'detect', required: true },
      { key: 'compare', type: 'text', label: 'Compare With (for compare)', placeholder: './other-face.jpg' },
      { key: 'output', type: 'text', label: 'Output File', placeholder: './faces-detected.png' },
    ],
    buildInput: (v) => ({ input: v.input, operation: v.operation, compare: v.compare, output: v.output }),
  },
  {
    id: 'generate_image',
    icon: '🖌️',
    label: 'AI Generate',
    desc: 'Generate images with AI: DALL-E, Stable Diffusion. Text-to-image, image-to-image, inpainting.',
    color: 'indigo',
    fields: [
      { key: 'prompt', type: 'textarea', label: 'Prompt', placeholder: 'A futuristic cityscape at sunset with flying cars...', required: true },
      { key: 'model', type: 'select', label: 'Model', options: ['dall-e-3','dall-e-2','stable-diffusion-xl','midjourney'], default: 'dall-e-3' },
      { key: 'size', type: 'select', label: 'Size', options: ['256x256','512x512','1024x1024','1792x1024','1024x1792'], default: '1024x1024' },
      { key: 'style', type: 'select', label: 'Style', options: ['vivid','natural','photographic','digital-art','anime','3d-render'], default: 'vivid' },
      { key: 'quality', type: 'select', label: 'Quality', options: ['standard','hd'], default: 'hd' },
      { key: 'n', type: 'number', label: 'Number of Images', placeholder: '1', default: 1 },
    ],
    buildInput: (v) => ({ prompt: v.prompt, model: v.model, size: v.size, style: v.style, quality: v.quality, n: Number(v.n) || 1 }),
  },
  {
    id: 'image_batch',
    icon: '📦',
    label: 'Batch Process',
    desc: 'Batch process multiple images: resize, convert, compress, watermark, rename.',
    color: 'teal',
    fields: [
      { key: 'input_dir', type: 'text', label: 'Input Directory', placeholder: './images/', required: true },
      { key: 'operation', type: 'select', label: 'Operation', options: ['resize','convert','compress','watermark','rename','thumbnails','strip_metadata'], default: 'compress', required: true },
      { key: 'format', type: 'select', label: 'Output Format', options: ['same','png','jpeg','webp','avif'], default: 'webp' },
      { key: 'width', type: 'number', label: 'Width (for resize)', placeholder: '800' },
      { key: 'quality', type: 'range', label: 'Quality (for compress)', min: 1, max: 100, default: 80 },
      { key: 'output_dir', type: 'text', label: 'Output Directory', placeholder: './optimized/' },
    ],
    buildInput: (v) => ({ input_dir: v.input_dir, operation: v.operation, format: v.format, width: v.width ? Number(v.width) : undefined, quality: Number(v.quality), output_dir: v.output_dir }),
  },
  {
    id: 'image_export',
    icon: '📤',
    label: 'Export Variants',
    desc: 'Generate responsive image sets: srcset, favicon set, app icons, social media sizes, sprite sheets.',
    color: 'rose',
    fields: [
      { key: 'input', type: 'text', label: 'Source Image', placeholder: './logo.png', required: true },
      { key: 'preset', type: 'select', label: 'Export Preset', options: ['srcset','favicons','app_icons','social_media','sprite_sheet','responsive','thumbnails'], default: 'srcset', required: true },
      { key: 'format', type: 'select', label: 'Output Format', options: ['png','webp','avif','jpeg','ico'], default: 'webp' },
      { key: 'output_dir', type: 'text', label: 'Output Directory', placeholder: './export/' },
    ],
    buildInput: (v) => ({ input: v.input, preset: v.preset, format: v.format, output_dir: v.output_dir }),
  },
];

interface Props {
  onClose?: () => void;
  onRunTool: (message: string) => void;
  onPreviewContent?: (c: PreviewContent) => void;
}

const ImageToolsPanel: React.FC<Props> = ({ onClose, onRunTool, onPreviewContent }) => (
  <ToolExecutionPanel
    categoryTitle="Image Tools"
    categorySubtitle="Transform, Filter, Analyze & Generate"
    categoryColor="violet"
    tools={TOOLS}
    onClose={onClose}
    onRunTool={onRunTool}
    onPreviewContent={onPreviewContent}
  />
);

export default ImageToolsPanel;
