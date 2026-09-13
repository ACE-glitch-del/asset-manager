const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 读取全部数据
app.get('/api/data', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      res.json(JSON.parse(raw));
    } else {
      res.json({});
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 保存全部数据
app.post('/api/data', (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: '无效数据' });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    res.json({ success: true, savedAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 导出数据（下载JSON备份）
app.get('/api/export', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="asset-backup-' + new Date().toISOString().slice(0,10) + '.json"');
      fs.createReadStream(DATA_FILE).pipe(res);
    } else {
      res.status(404).json({ error: '暂无数据' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== 家庭健康档案 =====
const FH_DATA_FILE = path.join(DATA_DIR, 'family-health.json');
const GH_TOKEN = process.env.GITHUB_TOKEN || '';
const GH_REPO = process.env.GITHUB_REPO || 'ACE-glitch-del/asset-manager';
const GH_DATA_PATH = 'family-health-data.json';

async function ghFetch() {
  if (!GH_TOKEN) return null;
  try {
    const res = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_DATA_PATH}`, {
      headers: { 'Authorization': `token ${GH_TOKEN}`, 'User-Agent': 'asset-manager' }
    });
    if (res.status === 404) return { data: { members: [] }, sha: null };
    if (!res.ok) return null;
    const json = await res.json();
    const content = Buffer.from(json.content, 'base64').toString('utf-8');
    return { data: JSON.parse(content), sha: json.sha };
  } catch (e) {
    console.error('GitHub读取失败:', e.message);
    return null;
  }
}

async function ghSave(data, sha) {
  if (!GH_TOKEN) return false;
  try {
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    const body = { message: `更新家庭健康档案 ${new Date().toISOString()}`, content, branch: 'main' };
    if (sha) body.sha = sha;
    const res = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_DATA_PATH}`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${GH_TOKEN}`, 'User-Agent': 'asset-manager', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res.ok;
  } catch (e) {
    console.error('GitHub保存失败:', e.message);
    return false;
  }
}

app.get('/api/family-health', async (req, res) => {
  try {
    const gh = await ghFetch();
    if (gh) return res.json(gh.data);
    if (fs.existsSync(FH_DATA_FILE)) {
      return res.json(JSON.parse(fs.readFileSync(FH_DATA_FILE, 'utf-8')));
    }
    res.json({ members: [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/family-health', async (req, res) => {
  try {
    const data = req.body;
    if (!data || !Array.isArray(data.members)) return res.status(400).json({ error: '无效数据' });
    fs.writeFileSync(FH_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    let githubSynced = false;
    if (GH_TOKEN) {
      const latest = await ghFetch();
      const sha = latest ? latest.sha : null;
      githubSynced = await ghSave(data, sha);
    }
    res.json({ success: true, savedAt: new Date().toISOString(), githubSynced });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log('资产管理系统运行在 http://localhost:' + PORT);
});
