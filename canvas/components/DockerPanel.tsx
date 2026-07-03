import React from 'react';
import ToolExecutionPanel, { ToolDefinition } from './ToolExecutionPanel';
import { PreviewContent } from './PanelPreview';

const TOOLS: ToolDefinition[] = [
  {
    id: 'deploy_generate',
    icon: '📄',
    label: 'Generate Config',
    desc: 'Generate Dockerfile, docker-compose.yml, nginx.conf, CI/CD pipelines, or Kubernetes manifests.',
    color: 'cyan',
    fields: [
      { key: 'type', type: 'select', label: 'Config Type', options: ['dockerfile','docker-compose','nginx','github-actions','gitlab-ci','kubernetes','terraform','vercel','cloudflare'], default: 'dockerfile' },
      { key: 'app_type', type: 'select', label: 'Application Type', options: ['node','python','go','java','rust','php','ruby','static','fullstack'], default: 'node' },
      { key: 'port', type: 'number', label: 'Application Port', default: 3000, min: 80, max: 65535 },
      { key: 'name', type: 'text', label: 'Service Name', placeholder: 'my-api', required: true },
      { key: 'features', type: 'text', label: 'Features (optional)', placeholder: 'ssl, redis, postgres, monitoring' },
    ],
    buildInput: (v) => ({ type: v.type, app_type: v.app_type, port: Number(v.port), name: v.name, features: v.features }),
  },
  {
    id: 'docker_build',
    icon: '🔨',
    label: 'Build Image',
    desc: 'Build a Docker image from a Dockerfile with multi-stage builds, build args, and caching.',
    color: 'blue',
    fields: [
      { key: 'tag', type: 'text', label: 'Image Tag', placeholder: 'myapp:latest', required: true },
      { key: 'path', type: 'text', label: 'Build Context Path', default: '.', placeholder: '.' },
      { key: 'dockerfile', type: 'text', label: 'Dockerfile Path', default: 'Dockerfile', placeholder: 'Dockerfile' },
      { key: 'build_args', type: 'json', label: 'Build Args (JSON)', rows: 3, placeholder: '{"NODE_ENV":"production","VERSION":"1.0.0"}' },
      { key: 'no_cache', type: 'checkbox', label: 'No Cache', placeholder: 'Disable build cache' },
    ],
    buildInput: (v) => {
      let build_args;
      try { build_args = v.build_args ? JSON.parse(v.build_args) : undefined; } catch { build_args = undefined; }
      return { tag: v.tag, path: v.path, dockerfile: v.dockerfile, build_args, no_cache: !!v.no_cache };
    },
  },
  {
    id: 'docker_run',
    icon: '▶️',
    label: 'Run Container',
    desc: 'Start a Docker container with port mapping, volumes, environment variables, and networking.',
    color: 'emerald',
    fields: [
      { key: 'image', type: 'text', label: 'Image', placeholder: 'myapp:latest or nginx:alpine', required: true },
      { key: 'name', type: 'text', label: 'Container Name', placeholder: 'my-container' },
      { key: 'ports', type: 'text', label: 'Port Mapping', placeholder: '3000:3000, 5432:5432' },
      { key: 'env', type: 'json', label: 'Environment Variables (JSON)', rows: 3, placeholder: '{"NODE_ENV":"production","DATABASE_URL":"postgres://..."}' },
      { key: 'detach', type: 'checkbox', label: 'Run in Background', placeholder: 'Detach mode (-d)' },
    ],
    buildInput: (v) => {
      let env;
      try { env = v.env ? JSON.parse(v.env) : undefined; } catch { env = undefined; }
      return { image: v.image, name: v.name, ports: v.ports, env, detach: !!v.detach };
    },
  },
  {
    id: 'docker_compose',
    icon: '🎼',
    label: 'Docker Compose',
    desc: 'Manage multi-container applications with docker-compose up/down/build/logs.',
    color: 'violet',
    fields: [
      { key: 'operation', type: 'select', label: 'Operation', options: ['up','down','build','logs','ps','restart','exec','pull'], default: 'up' },
      { key: 'path', type: 'text', label: 'Compose File', default: 'docker-compose.yml', placeholder: 'docker-compose.yml' },
      { key: 'service', type: 'text', label: 'Service Name (optional)', placeholder: 'Leave empty for all services' },
      { key: 'detach', type: 'checkbox', label: 'Detached Mode', placeholder: 'Run in background' },
    ],
    buildInput: (v) => ({ operation: v.operation, path: v.path, service: v.service, detach: !!v.detach }),
  },
  {
    id: 'docker_manage',
    icon: '🗂️',
    label: 'Manage Docker',
    desc: 'List, stop, remove containers, images, volumes, and networks. System prune and stats.',
    color: 'rose',
    fields: [
      { key: 'operation', type: 'select', label: 'Operation', options: ['ps','stop','rm','images','volumes','networks','stats','prune','inspect','logs'], default: 'ps' },
      { key: 'target', type: 'text', label: 'Target (container/image ID)', placeholder: 'Container ID, image name, or leave empty for all' },
      { key: 'force', type: 'checkbox', label: 'Force', placeholder: 'Force operation (no confirmation)' },
    ],
    buildInput: (v) => ({ operation: v.operation, target: v.target, force: !!v.force }),
  },
];

interface Props {
  onClose?: () => void;
  onRunTool: (message: string) => void;
  onPreviewContent?: (c: PreviewContent) => void;
}

const DockerPanel: React.FC<Props> = ({ onClose, onRunTool, onPreviewContent }) => (
  <ToolExecutionPanel
    categoryTitle="Docker & Deploy"
    categorySubtitle="Containers, Compose & Config Generation"
    categoryColor="sky"
    tools={TOOLS}
    onClose={onClose}
    onRunTool={onRunTool}
    onPreviewContent={onPreviewContent}
  />
);

export default DockerPanel;
