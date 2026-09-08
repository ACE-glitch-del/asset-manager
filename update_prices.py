#!/usr/bin/env python3
"""每天自动更新持仓股票最新价格"""
import urllib.request
import base64
import json
import os
import re

TOKEN = os.environ.get('GITHUB_TOKEN', '')
OWNER = 'ACE-glitch-del'
REPO = 'asset-manager'
BRANCH = 'main'

def get_stock_prices():
    """从新浪财经获取股票价格"""
    prices = {}
    
    # A股
    a_codes = ['sz002041', 'sz300024', 'sh513180', 'sh601899']
    # 港股
    hk_codes = ['hk01810', 'hk06936', 'hk09988']
    
    all_codes = a_codes + hk_codes
    
    try:
        url = f'http://hq.sinajs.cn/list={",".join(all_codes)}'
        req = urllib.request.Request(url, headers={
            'Referer': 'https://finance.sina.com.cn',
            'User-Agent': 'Mozilla/5.0'
        })
        resp = urllib.request.urlopen(req, timeout=10)
        text = resp.read().decode('gbk')
        
        lines = text.strip().split('\n')
        for i, line in enumerate(lines):
            if '=' not in line:
                continue
            code = all_codes[i] if i < len(all_codes) else ''
            match = re.search(r'"([^"]+)"', line)
            if not match:
                continue
            data = match.group(1).split(',')
            
            if code.startswith('sz') or code.startswith('sh'):
                # A股: 名称,今开,昨收,当前价,最高,最低,...
                if len(data) > 3:
                    name = data[0]
                    price = float(data[3]) if data[3] else 0
                    prices[code] = {'name': name, 'price': price}
            elif code.startswith('hk'):
                # 港股: 英文名,中文名,今开,昨收,最高,最低,当前价,...
                if len(data) > 6:
                    name = data[1] if data[1] else data[0]
                    price = float(data[6]) if data[6] else 0
                    prices[code] = {'name': name, 'price': price}
    except Exception as e:
        print(f'获取股价失败: {e}')
    
    return prices

def main():
    if not TOKEN:
        print('未设置GITHUB_TOKEN')
        return
    
    # 获取最新股价
    prices = get_stock_prices()
    print(f'获取到 {len(prices)} 只股票价格')
    for code, info in prices.items():
        print(f'  {code}: {info["name"]} = {info["price"]}')
    
    # 下载当前data.json
    req = urllib.request.Request(
        f'https://api.github.com/repos/{OWNER}/{REPO}/contents/data.json?ref={BRANCH}',
        headers={'Authorization': f'token {TOKEN}', 'Accept': 'application/vnd.github.v3+json'}
    )
    resp = urllib.request.urlopen(req)
    d = json.loads(resp.read())
    sha = d['sha']
    data = json.loads(base64.b64decode(d['content']).decode('utf-8'))
    
    # 更新持仓价格
    code_map = {
        '002041': 'sz002041',
        '300024': 'sz300024',
        '513180': 'sh513180',
        '601899': 'sh601899',
        '01810.HK': 'hk01810',
        '06936.HK': 'hk06936',
        '09988.HK': 'hk09988',
    }
    
    updated = 0
    for h in data.get('holdings', []):
        code = h.get('code', '')
        sina_code = code_map.get(code, '')
        if sina_code and sina_code in prices:
            old_price = h.get('price', 0)
            new_price = prices[sina_code]['price']
            if new_price > 0 and abs(new_price - old_price) > 0.001:
                h['price'] = new_price
                updated += 1
                print(f'  更新 {h["name"]}({code}): {old_price} -> {new_price}')
    
    if updated == 0:
        print('没有价格需要更新')
        return
    
    # 上传
    b64 = base64.b64encode(json.dumps(data, ensure_ascii=False, indent=2).encode('utf-8')).decode('utf-8')
    upload_data = json.dumps({
        'message': f'自动更新 {updated} 只持仓最新价格',
        'content': b64,
        'branch': BRANCH,
        'sha': sha
    }).encode('utf-8')
    
    req2 = urllib.request.Request(
        f'https://api.github.com/repos/{OWNER}/{REPO}/contents/data.json',
        data=upload_data,
        headers={
            'Authorization': f'token {TOKEN}',
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        method='PUT'
    )
    resp2 = urllib.request.urlopen(req2)
    result = json.loads(resp2.read())
    print(f'上传成功！提交: {result["commit"]["sha"][:10]}')

if __name__ == '__main__':
    main()
