import { toast, getApiKey, initShell, apiUrl } from './common.js';

let mode = 'text-to-image';

const chatMessages = () => document.getElementById('chatMessages');
const promptInput = () => document.getElementById('promptInput');

function fillSelect(select, models) {
  select.innerHTML = models.map(m =>
    `<option value="${m.id}" title="${m.description.replace(/"/g, "'")}"${m.default ? ' selected' : ''}>${m.name}</option>`
  ).join('');
}

async function loadModels() {
  try {
    const res = await fetch(apiUrl('/models'));
    if (!res.ok) throw new Error('Failed to load models');
    const { models } = await res.json();
    fillSelect(document.getElementById('modelSelect'), models.filter(m => m.type === mode));
  } catch (err) {
    toast('模型加载失败: ' + err.message);
  }
}

function setMode(next) {
  mode = next;
  document.querySelectorAll('.seg[data-mode]').forEach(el => {
    el.classList.toggle('active', el.dataset.mode === mode);
  });
  promptInput().placeholder = mode === 'text-to-image'
    ? '描述你想生成的图片…'
    : '输入问题或设计需求…';
  loadModels();
}

function renderMarkdown(text) {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, (m) => m.startsWith('<') ? m : '<p>' + m + '</p>');
}

function clearEmpty() {
  const empty = chatMessages().querySelector('.chat-empty');
  if (empty) empty.remove();
}

function scrollToBottom() {
  const el = chatMessages();
  el.scrollTop = el.scrollHeight;
}

function appendUserMessage(text) {
  clearEmpty();
  const bubble = document.createElement('div');
  bubble.className = 'msg msg-user';
  bubble.textContent = text;
  chatMessages().appendChild(bubble);
  scrollToBottom();
}

function appendTyping() {
  const el = document.createElement('div');
  el.className = 'msg msg-assistant msg-typing';
  el.textContent = mode === 'text-to-image' ? '生成中…' : '思考中…';
  chatMessages().appendChild(el);
  scrollToBottom();
  return el;
}

function appendImageMessage(url, modelName) {
  const wrap = document.createElement('div');
  wrap.className = 'msg msg-assistant msg-image';
  wrap.innerHTML = `
    <img src="${url}" alt="生成结果"/>
    <div class="msg-image-foot">
      <small>${modelName}</small>
      <a href="${url}" download="output.jpg">下载</a>
    </div>`;
  chatMessages().appendChild(wrap);
  scrollToBottom();
}

function appendTextMessage(md, modelName) {
  const wrap = document.createElement('div');
  wrap.className = 'msg msg-assistant msg-text';
  wrap.innerHTML = `
    <div class="msg-text-body">${renderMarkdown(md)}</div>
    <small class="msg-model">${modelName}</small>`;
  chatMessages().appendChild(wrap);
  scrollToBottom();
}

async function runGenerate() {
  const prompt = promptInput().value.trim();
  const model = document.getElementById('modelSelect').value;
  const key = getApiKey();
  const btn = document.getElementById('runBtn');

  if (!prompt) return toast('请输入提示词');
  if (!key) return toast('请在右上角填写 Token');
  if (!model) return toast('请选择模型');

  appendUserMessage(prompt);
  promptInput().value = '';
  autoResizePrompt();

  const typing = appendTyping();
  btn.disabled = true;

  try {
    const res = await fetch(apiUrl('/generate'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key,
      },
      body: JSON.stringify({ prompt, model, type: mode }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.details || err.error || 'API Error');
    }

    const modelName = res.headers.get('X-Model') || model;

    if (mode === 'text-to-image') {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      appendImageMessage(url, modelName);
    } else {
      const md = await res.text();
      appendTextMessage(md, modelName);
    }
  } catch (err) {
    toast(err.message);
    const errMsg = document.createElement('div');
    errMsg.className = 'msg msg-assistant msg-error';
    errMsg.textContent = err.message;
    chatMessages().appendChild(errMsg);
    scrollToBottom();
  }

  typing.remove();
  btn.disabled = false;
}

function autoResizePrompt() {
  const el = promptInput();
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
}

initShell();

document.querySelectorAll('.seg[data-mode]').forEach(el => {
  el.addEventListener('click', () => setMode(el.dataset.mode));
});

document.getElementById('runBtn').addEventListener('click', runGenerate);

promptInput().addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    runGenerate();
  }
});
promptInput().addEventListener('input', autoResizePrompt);

const nodeInput = document.getElementById('workerUrl');
if (nodeInput) {
  nodeInput.addEventListener('change', loadModels);
  nodeInput.addEventListener('blur', loadModels);
}

loadModels();
