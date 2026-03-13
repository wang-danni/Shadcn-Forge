import http from 'node:http';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';

const ENV_FILES = ['.env.local', '.env'];

const loadEnvFiles = () => {
  const rootDir = process.cwd();

  for (const fileName of ENV_FILES) {
    const filePath = path.join(rootDir, fileName);
    if (!fs.existsSync(filePath)) continue;

    const raw = fs.readFileSync(filePath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (!key || process.env[key]) continue;
      process.env[key] = value;
    }
  }
};

loadEnvFiles();

const PORT = Number(process.env.PORT || 8787);
const REQUEST_TIMEOUT_MS = 30000;
const execFileAsync = promisify(execFile);

const normalizeProvider = (provider) => {
  const normalized = (provider || '').trim().toLowerCase();
  if (normalized === 'qwen' || normalized === 'tongyi' || normalized === 'tongyi-qianwen' || normalized === 'dashscope') {
    return 'qwen';
  }
  if (normalized === 'openai' || normalized === 'openai-compatible' || normalized === 'compatible') {
    return 'openai-compatible';
  }
  if (normalized === 'deepseek') {
    return 'deepseek';
  }
  return 'gemini';
};

const inferProvider = () => {
  if (process.env.AI_PROVIDER) {
    return normalizeProvider(process.env.AI_PROVIDER);
  }

  const configuredModel = process.env.AI_MODEL || process.env.VITE_AI_MODEL || process.env.VITE_GEMINI_MODEL || '';

  if (process.env.DASHSCOPE_API_KEY || /qwen|qwq/i.test(configuredModel)) {
    return 'qwen';
  }

  if (process.env.DEEPSEEK_API_KEY || /deepseek/i.test(configuredModel)) {
    return 'deepseek';
  }

  if (process.env.AI_BASE_URL || process.env.AI_API_KEY || process.env.OPENAI_API_KEY) {
    return 'openai-compatible';
  }

  return 'gemini';
};

const PROVIDER = inferProvider();

const resolveApiKey = (provider) => {
  if (provider === 'qwen') {
    return process.env.AI_API_KEY || process.env.DASHSCOPE_API_KEY || '';
  }

  if (provider === 'deepseek') {
    return process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY || '';
  }

  if (provider === 'openai-compatible') {
    return process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
  }

  return process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
};

const resolveDefaultModel = (provider) => {
  if (provider === 'qwen') {
    return process.env.AI_MODEL || process.env.QWEN_MODEL || process.env.VITE_AI_MODEL || 'qwen-flash';
  }

  if (provider === 'deepseek') {
    return process.env.AI_MODEL || process.env.DEEPSEEK_MODEL || process.env.VITE_AI_MODEL || 'deepseek-chat';
  }

  if (provider === 'openai-compatible') {
    return process.env.AI_MODEL || process.env.OPENAI_MODEL || process.env.VITE_AI_MODEL || 'gpt-4o-mini';
  }

  return process.env.AI_MODEL || process.env.GEMINI_MODEL || process.env.VITE_AI_MODEL || process.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';
};

const resolveBaseUrl = (provider) => {
  const configuredBaseUrl = process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL;
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, '');
  }

  if (provider === 'qwen') {
    return 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  }

  if (provider === 'deepseek') {
    return 'https://api.deepseek.com/v1';
  }

  if (provider === 'openai-compatible') {
    return 'https://api.openai.com/v1';
  }

  return 'https://generativelanguage.googleapis.com/v1beta';
};

const API_KEY = resolveApiKey(PROVIDER);
const DEFAULT_MODEL = resolveDefaultModel(PROVIDER);
const BASE_URL = resolveBaseUrl(PROVIDER);

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
};

const readRequestBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
};

const parseGeminiText = (data) => data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

const parseOpenAICompatibleText = (data) => {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part) return part.text || '';
        return '';
      })
      .join('');
  }
  return '';
};

const buildUpstreamRequest = ({ provider, apiKey, baseUrl, model, prompt, systemInstruction, responseMimeType }) => {
  if (provider === 'qwen' || provider === 'deepseek' || provider === 'openai-compatible') {
    const body = {
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      ...(responseMimeType === 'application/json' ? { response_format: { type: 'json_object' } } : {})
    };

    return {
      providerLabel: provider,
      url: `${baseUrl}/chat/completions`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body,
      parseText: parseOpenAICompatibleText
    };
  }

  return {
    providerLabel: 'gemini',
    url: `${baseUrl}/models/${model}:generateContent?key=${apiKey}`,
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        responseMimeType,
        temperature: 0.2
      }
    },
    parseText: parseGeminiText
  };
};

const escapeForPowerShell = (value) => value.replace(/'/g, "''");

const requestViaPowerShell = async (url, headers, payload) => {
  const script = [
    `[Console]::InputEncoding = [System.Text.Encoding]::UTF8`,
    `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8`,
    `$OutputEncoding = [System.Text.Encoding]::UTF8`,
    `$uri = '${escapeForPowerShell(url)}'`,
    `$headersJson = @'`,
    JSON.stringify(headers),
    `'@`,
    `$body = @'`,
    JSON.stringify(payload),
    `'@`,
    `$headersObject = $headersJson | ConvertFrom-Json`,
    `$headers = @{}`,
    `$headersObject.PSObject.Properties | ForEach-Object { $headers[$_.Name] = [string]$_.Value }`,
    `try {`,
    `  $response = Invoke-WebRequest -UseBasicParsing -Uri $uri -Method POST -Headers $headers -ContentType 'application/json' -Body $body`,
    `  @{ status = [int]$response.StatusCode; ok = $true; rawResponse = [string]$response.Content } | ConvertTo-Json -Compress`,
    `} catch {`,
    `  $statusCode = 500`,
    `  $responseBody = ''`,
    `  if ($_.Exception.Response) {`,
    `    $statusCode = [int]$_.Exception.Response.StatusCode`,
    `    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())`,
    `    $responseBody = $reader.ReadToEnd()`,
    `  } else {`,
    `    $responseBody = $_ | Out-String`,
    `  }`,
    `  @{ status = $statusCode; ok = $false; rawResponse = [string]$responseBody } | ConvertTo-Json -Compress`,
    `}`
  ].join('\n');

  const { stdout } = await execFileAsync(
    'powershell',
    ['-NoProfile', '-Command', script],
    { timeout: REQUEST_TIMEOUT_MS, maxBuffer: 1024 * 1024, encoding: 'utf8' }
  );

  return JSON.parse(stdout.trim());
};

const requestUpstream = async (url, headers, payload) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify(payload)
    });

    clearTimeout(timeoutId);
    return {
      status: geminiRes.status,
      ok: geminiRes.ok,
      rawResponse: await geminiRes.text()
    };
  } catch (error) {
    clearTimeout(timeoutId);

    const connectTimedOut =
      error instanceof Error &&
      'cause' in error &&
      error.cause &&
      typeof error.cause === 'object' &&
      'code' in error.cause &&
      error.cause.code === 'UND_ERR_CONNECT_TIMEOUT';

    if (process.platform === 'win32' && connectTimedOut) {
      return requestViaPowerShell(url, headers, payload);
    }

    throw error;
  }
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/ai/generate') {
    sendJson(res, 404, { error: { message: 'Not Found' } });
    return;
  }

  if (!API_KEY) {
    sendJson(res, 500, { error: { message: `API key for provider ${PROVIDER} is not configured on the server` } });
    return;
  }

  try {
    const rawBody = await readRequestBody(req);
    const body = JSON.parse(rawBody || '{}');
    const prompt = typeof body.prompt === 'string' ? body.prompt : '';
    const systemInstruction = typeof body.systemInstruction === 'string' ? body.systemInstruction : '';
    const responseMimeType = typeof body.responseMimeType === 'string' ? body.responseMimeType : 'text/plain';
    const model = typeof body.model === 'string' && body.model ? body.model : DEFAULT_MODEL;

    if (!prompt.trim()) {
      sendJson(res, 400, { error: { message: 'prompt is required' } });
      return;
    }

    const upstreamRequest = buildUpstreamRequest({
      provider: PROVIDER,
      apiKey: API_KEY,
      baseUrl: BASE_URL,
      model,
      prompt,
      systemInstruction,
      responseMimeType
    });

    const upstreamResult = await requestUpstream(upstreamRequest.url, upstreamRequest.headers, upstreamRequest.body);
    const rawResponse = upstreamResult.rawResponse;
    const parsedResponse = rawResponse ? JSON.parse(rawResponse) : {};

    if (!upstreamResult.ok) {
      sendJson(res, upstreamResult.status, {
        error: {
          message: parsedResponse?.error?.message || rawResponse || `${upstreamRequest.providerLabel} request failed`
        }
      });
      return;
    }

    const text = upstreamRequest.parseText(parsedResponse);
    if (!text) {
      sendJson(res, 502, { error: { message: `${upstreamRequest.providerLabel} returned an empty response` } });
      return;
    }

    sendJson(res, 200, { text });
  } catch (error) {
    if (error instanceof SyntaxError) {
      sendJson(res, 400, { error: { message: 'Invalid JSON body' } });
      return;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      sendJson(res, 504, { error: { message: 'AI request timed out' } });
      return;
    }

    sendJson(res, 500, {
      error: {
        message: error instanceof Error ? error.message : 'Unknown server error'
      }
    });
  }
});

server.on('error', (error) => {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'EADDRINUSE') {
    console.error(
      `AI proxy server could not start because port ${PORT} is already in use. ` +
      'This usually means another dev:api process is already running. Stop the old process or start with a different PORT.'
    );
    process.exit(1);
  }

  throw error;
});

server.listen(PORT, () => {
  console.log(`AI proxy server listening on http://localhost:${PORT}`);
});