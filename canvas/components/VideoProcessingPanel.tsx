import React from 'react';
import ToolExecutionPanel, { ToolDefinition } from './ToolExecutionPanel';
import { PreviewContent } from './PanelPreview';

const TOOLS: ToolDefinition[] = [
  {
    id: 'video_transform',
    icon: '✂️',
    label: 'Transform Video',
    desc: 'Trim, crop, resize, rotate, speed up/slow down, reverse, or stabilize video files via ffmpeg.',
    color: 'cyan',
    fields: [
      { key: 'input', type: 'text', label: 'Input File', placeholder: './video.mp4', required: true },
      { key: 'operation', type: 'select', label: 'Operation', options: ['trim','crop','resize','rotate','speed','reverse','stabilize','loop','flip'], default: 'trim' },
      { key: 'start', type: 'text', label: 'Start Time (for trim)', placeholder: '00:00:05' },
      { key: 'duration', type: 'text', label: 'Duration (for trim)', placeholder: '00:00:30' },
      { key: 'width', type: 'number', label: 'Width (for resize)', placeholder: '1920' },
      { key: 'height', type: 'number', label: 'Height (for resize)', placeholder: '1080' },
      { key: 'output', type: 'text', label: 'Output File', placeholder: './output.mp4' },
    ],
    buildInput: (v) => ({ input: v.input, operation: v.operation, start: v.start, duration: v.duration, width: v.width ? Number(v.width) : undefined, height: v.height ? Number(v.height) : undefined, output: v.output }),
  },
  {
    id: 'video_convert',
    icon: '💱',
    label: 'Convert Format',
    desc: 'Convert between video formats: MP4, WebM, AVI, MOV, MKV, GIF, with codec and quality control.',
    color: 'emerald',
    fields: [
      { key: 'input', type: 'text', label: 'Input File', placeholder: './input.avi', required: true },
      { key: 'format', type: 'select', label: 'Output Format', options: ['mp4','webm','avi','mov','mkv','gif','flv','wmv'], default: 'mp4' },
      { key: 'codec', type: 'select', label: 'Codec', options: ['auto','h264','h265','vp9','av1','prores'], default: 'auto' },
      { key: 'quality', type: 'select', label: 'Quality', options: ['low','medium','high','lossless'], default: 'high' },
      { key: 'output', type: 'text', label: 'Output File', placeholder: './output.mp4' },
    ],
    buildInput: (v) => ({ input: v.input, format: v.format, codec: v.codec, quality: v.quality, output: v.output }),
  },
  {
    id: 'video_analyze',
    icon: '🔬',
    label: 'Analyze Video',
    desc: 'Extract metadata, codec info, bitrate, resolution, frame rate, duration, and keyframe analysis.',
    color: 'blue',
    fields: [
      { key: 'input', type: 'text', label: 'Video File', placeholder: './video.mp4', required: true },
      { key: 'detail', type: 'select', label: 'Detail Level', options: ['summary','full','streams','keyframes','scenes'], default: 'summary' },
    ],
    buildInput: (v) => ({ input: v.input, detail: v.detail }),
  },
  {
    id: 'video_filter',
    icon: '🎨',
    label: 'Apply Filter',
    desc: 'Apply visual filters: blur, sharpen, denoise, color correction, brightness, contrast, saturation.',
    color: 'pink',
    fields: [
      { key: 'input', type: 'text', label: 'Input File', placeholder: './video.mp4', required: true },
      { key: 'filter', type: 'select', label: 'Filter', options: ['blur','sharpen','denoise','brightness','contrast','saturation','grayscale','sepia','vignette','eq'], default: 'brightness' },
      { key: 'intensity', type: 'range', label: 'Intensity', min: 0, max: 100, default: 50 },
      { key: 'output', type: 'text', label: 'Output File', placeholder: './filtered.mp4' },
    ],
    buildInput: (v) => ({ input: v.input, filter: v.filter, intensity: Number(v.intensity), output: v.output }),
  },
  {
    id: 'video_audio',
    icon: '🔊',
    label: 'Audio Operations',
    desc: 'Extract audio, add music, adjust volume, mix tracks, strip audio, or add voiceover.',
    color: 'violet',
    fields: [
      { key: 'input', type: 'text', label: 'Video File', placeholder: './video.mp4', required: true },
      { key: 'operation', type: 'select', label: 'Operation', options: ['extract','add_music','volume','strip','mix','replace'], default: 'extract' },
      { key: 'audio_file', type: 'text', label: 'Audio File (for add/mix/replace)', placeholder: './music.mp3' },
      { key: 'volume', type: 'range', label: 'Volume Level', min: 0, max: 200, default: 100 },
      { key: 'output', type: 'text', label: 'Output File', placeholder: './output.mp4' },
    ],
    buildInput: (v) => ({ input: v.input, operation: v.operation, audio_file: v.audio_file, volume: Number(v.volume), output: v.output }),
  },
  {
    id: 'video_overlay',
    icon: '📐',
    label: 'Overlay / Watermark',
    desc: 'Add text, image, or video overlays. Watermark with logo, add subtitles, or picture-in-picture.',
    color: 'amber',
    fields: [
      { key: 'input', type: 'text', label: 'Video File', placeholder: './video.mp4', required: true },
      { key: 'type', type: 'select', label: 'Overlay Type', options: ['text','image','video','subtitles'], default: 'text' },
      { key: 'content', type: 'text', label: 'Overlay Content', placeholder: 'Watermark text or path to image/video', required: true },
      { key: 'position', type: 'select', label: 'Position', options: ['top-left','top-right','bottom-left','bottom-right','center'], default: 'bottom-right' },
      { key: 'opacity', type: 'range', label: 'Opacity', min: 0, max: 100, default: 80 },
      { key: 'output', type: 'text', label: 'Output File', placeholder: './watermarked.mp4' },
    ],
    buildInput: (v) => ({ input: v.input, type: v.type, content: v.content, position: v.position, opacity: Number(v.opacity), output: v.output }),
  },
  {
    id: 'video_ai',
    icon: '🤖',
    label: 'AI Video Analysis',
    desc: 'AI-powered scene detection, object tracking, content analysis, and video summarization.',
    color: 'purple',
    fields: [
      { key: 'input', type: 'text', label: 'Video File', placeholder: './video.mp4', required: true },
      { key: 'analysis', type: 'select', label: 'Analysis Type', options: ['scenes','objects','faces','text_ocr','summary','content_moderation','motion'], default: 'scenes' },
      { key: 'model', type: 'select', label: 'AI Model', options: ['auto','gpt-4-vision','gemini-pro-vision','claude-3'], default: 'auto' },
    ],
    buildInput: (v) => ({ input: v.input, analysis: v.analysis, model: v.model }),
  },
  {
    id: 'video_batch',
    icon: '📦',
    label: 'Batch Process',
    desc: 'Process multiple videos at once: batch convert, resize, compress, or extract frames.',
    color: 'orange',
    fields: [
      { key: 'input_dir', type: 'text', label: 'Input Directory', placeholder: './videos/', required: true },
      { key: 'operation', type: 'select', label: 'Operation', options: ['convert','resize','compress','extract_frames','thumbnails','concatenate'], default: 'compress' },
      { key: 'format', type: 'select', label: 'Output Format', options: ['mp4','webm','gif','jpg','png'], default: 'mp4' },
      { key: 'output_dir', type: 'text', label: 'Output Directory', placeholder: './output/' },
    ],
    buildInput: (v) => ({ input_dir: v.input_dir, operation: v.operation, format: v.format, output_dir: v.output_dir }),
  },
];

interface Props {
  onClose?: () => void;
  onRunTool: (message: string) => void;
  onPreviewContent?: (c: PreviewContent) => void;
}

const VideoProcessingPanel: React.FC<Props> = ({ onClose, onRunTool, onPreviewContent }) => (
  <ToolExecutionPanel
    categoryTitle="Video Processing"
    categorySubtitle="Transform, Convert, Filter & Analyze"
    categoryColor="pink"
    tools={TOOLS}
    onClose={onClose}
    onRunTool={onRunTool}
    onPreviewContent={onPreviewContent}
  />
);

export default VideoProcessingPanel;
