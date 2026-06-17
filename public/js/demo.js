import { toast, getApiKey, apiAuthHeaders, initShell, apiUrl } from './common.js';

let mode = 'text-to-image';
let conversation = [];

const chatMessages = () => document.getElementById('chatMessages');
const promptInput = () => document.getElementById('promptInput');

function fillSelect(select, models) {
  select.innerHTML = models.map(m =>
    `<option value="${m.id}" title="${(m.cf_description || '').replace(/"/g, "'")}"${m.cf_default ? ' selected' : ''}>${m.cf_name || m.id}</option>`
  ).join('');
}

async function loadModels() {
  const select = document.getElementById('modelSelect');
  if (!getApiKey()) {
    select.innerHTML = '<option value="">请先填写 Cloudflare API Token</option>';
    return;
  }

  try {
    const res = await fetch(apiUrl(`/v1/models?type=${mode}`), {
      headers: apiAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to load models');
    }
    const { data: models } = await res.json();
    fillSelect(select, models);
  } catch (err) {
    select.innerHTML = '<option value="">加载失败</option>';
    toast('模型加载失败: ' + err.message);
  }
}

function setMode(next) {
  mode = next;
  conversation = [];
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
  requestAnimationFrame(() => {
    const el = chatMessages();
    if (el) el.scrollTop = el.scrollHeight;
  });
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
  const img = document.createElement('img');
  img.alt = '生成结果';
  img.src = url;
  img.addEventListener('load', scrollToBottom);
  wrap.appendChild(img);
  const foot = document.createElement('div');
  foot.className = 'msg-image-foot';
  foot.innerHTML = `<small>${modelName}</small><a href="${url}" download="output.png">下载</a>`;
  wrap.appendChild(foot);
  chatMessages().appendChild(wrap);
  scrollToBottom();
}

function createStreamingTextMessage(modelName) {
  const wrap = document.createElement('div');
  wrap.className = 'msg msg-assistant msg-text';
  wrap.innerHTML = `
    <div class="msg-text-body"></div>
    <small class="msg-model">${modelName}</small>`;
  chatMessages().appendChild(wrap);
  scrollToBottom();
  return wrap.querySelector('.msg-text-body');
}

async function parseOpenAIStream(res, onDelta) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;

      try {
        const chunk = JSON.parse(data);
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          onDelta(fullText);
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  return fullText;
}

async function generateImage(prompt, model) {
  const res = await fetch(apiUrl('/v1/images/generations'), {
    method: 'POST',
    headers: apiAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ prompt, model, size: '1024x1024' }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || err.error || 'API Error');
  }

  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image in response');

  const url = `data:image/png;base64,${b64}`;
  appendImageMessage(url, model);
}

async function generateTextStream(prompt, model) {
  conversation.push({ role: 'user', content: prompt });

  const res = await fetch(apiUrl('/v1/chat/completions'), {
    method: 'POST',
    headers: apiAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      model,
      messages: conversation,
      stream: true,
    }),
  });

  if (!res.ok) {
    conversation.pop();
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || err.error || 'API Error');
  }

  const bodyEl = createStreamingTextMessage(model);
  const fullText = await parseOpenAIStream(res, (text) => {
    bodyEl.innerHTML = renderMarkdown(text);
    scrollToBottom();
  });

  conversation.push({ role: 'assistant', content: fullText });
}

async function runGenerate() {
  const prompt = promptInput().value.trim();
  const model = document.getElementById('modelSelect').value;
  const btn = document.getElementById('runBtn');

  if (!prompt) return toast('请输入提示词');
  if (!getApiKey()) return toast('请在右上角填写 Cloudflare API Token');
  if (!model) return toast('请选择模型');

  appendUserMessage(prompt);
  promptInput().value = '';
  autoResizePrompt();

  const typing = appendTyping();
  btn.disabled = true;

  try {
    if (mode === 'text-to-image') {
      await generateImage(prompt, model);
    } else {
      await generateTextStream(prompt, model);
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

document.querySelectorAll('[data-token-input]').forEach((input) => {
  input.addEventListener('change', loadModels);
});

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
