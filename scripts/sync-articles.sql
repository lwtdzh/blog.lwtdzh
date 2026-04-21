-- Auto-generated SQL from sync-articles.ts
-- Run with: npx wrangler d1 execute blog-db --local --file=scripts/sync-articles.sql

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  updated TEXT,
  description TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  cover TEXT DEFAULT '',
  content TEXT DEFAULT '',
  hidden INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  nickname TEXT NOT NULL,
  email TEXT DEFAULT '',
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR REPLACE INTO articles (slug, title, date, updated, description, tags, cover, content, hidden)
VALUES ('2024/09/02/jpsub/baixue', '「白色相簿」第一季、第二季 简日双语字幕、日文字幕、中日字幕', '2024-09-02T09:56:10+08:00', '2025-06-18T21:07:19+08:00', '"White Album" Season 1 and Season 2 dual-language subtitles (Japanese and Chinese), Japanese subtitles, and bilingual subtitles (Chinese and Japanese).「ホワイトアルバム」第1期、第二期 二言語字幕（日本語と中国語）、日本語字幕、および中日字幕（中国', '["中日双语字幕"]', 'https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20241219201132724.webp', '"White Album" Season 1 and Season 2 dual-language subtitles (Japanese and Chinese), Japanese subtitles, and bilingual subtitles (Chinese and Japanese).
「ホワイトアルバム」第1期、第二期 二言語字幕（日本語と中国語）、日本語字幕、および中日字幕（中国

<!-- more -->', 0);

INSERT OR REPLACE INTO articles (slug, title, date, updated, description, tags, cover, content, hidden)
VALUES ('2024/07/16/jpsub/blends', '「调教咖啡厅」简日双语字幕、日文字幕、中日字幕', '2024-07-16T20:48:00+08:00', '2025-06-18T21:07:19+08:00', '"Blend S" dual-language subtitles (Japanese and Chinese), Japanese subtitles, and bilingual subtitles (Chinese and Japanese).「ブレンド・S」二言語字幕（日本語と中国語）、日本語字幕、および中日字幕（中国語と日本語）。', '["中日双语字幕"]', 'https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20241219193220117.webp', '', 0);

INSERT OR REPLACE INTO articles (slug, title, date, updated, description, tags, cover, content, hidden)
VALUES ('2024/08/14/jpsub/clannad', '「CLANNAD」简日双语字幕、日文字幕、中日字幕', '2024-08-14T21:00:00+08:00', '2025-06-18T21:07:19+08:00', 'CLANNAD Season 1 + Season 2 bilingual subtitles (Chinese and Japanese).CLANNAD シーズン1 + シーズン2 中日二言語字幕（中国語と日本語）。', '["中日双语字幕"]', 'https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20241219194651228.webp', 'CLANNAD Season 1 + Season 2 bilingual subtitles (Chinese and Japanese).
CLANNAD シーズン1 + シーズン2 中日二言語字幕（中国語と日本語）。

<!-- more -->

## 【转载存档】CLANNAD S1+S2 中日双语字幕

![](https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20241219194651228.webp)

#### 片名、译名

CLANNAD -クラナド-(1期)
CLANNAD 〜AFTER STORY〜
团子大家族

#### 来源说明

简日繁日中日，双语，日语字幕。本帖为转载。原贴地址：[雪飘_澄空_NF-GL]CLANNAD S1+S2[简日·繁日双语字幕] - ACG字幕分享 - Anime字幕论坛 - Powered by Discuz! (acgrip.com) - [https://bbs.acgrip.com/thread-5880-1-1.html](https://bbs.acgrip.com/thread-5880-1-1.html)

#### 下载地址（Download link，ダウンロードリンク）

[Origin](https://bbs.acgrip.com/thread-5880-1-1.html)
[Lanzou](https://wwqq.lanzoub.com/b0r9gejhi)，password: 3x2g
[Baidu](https://pan.baidu.com/s/1yeiRf-YN2UpxIUqxBXkcvA?pwd=zuh6)
[Github](https://github.com/lwtdzh/imghost/blob/master/subs/%5B%E9%9B%AA%E9%A3%98_%E6%BE%84%E7%A9%BA_NF-GL%5D%20Clannad%20S1%20S2%20%5B%E7%AE%80%E6%97%A5%C2%B7%E7%B9%81%E6%97%A5%E5%8F%8C%E8%AF%AD%E5%AD%97%E5%B9%95%5D.zip)
[bilibili](https://www.bilibili.com/opus/965541998574436377)', 0);

INSERT OR REPLACE INTO articles (slug, title, date, updated, description, tags, cover, content, hidden)
VALUES ('2025/06/18/jpsub/dunyong', '「盾之勇者成名录」第一季简日双语字幕、日文字幕、中日字幕', '2025-06-18T20:18:41+08:00', '2025-06-18T21:07:19+08:00', '"The Rising of the Shield Hero" Season 1: JP Subs, Simplified CN Subs, JP-CN Dual Subs​。「盾の勇者の成り上がり」 第1期 日本語字幕／简体字字幕／日中双语字幕​。', '["中日双语字幕"]', 'https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20250618202141352.jpg', '"The Rising of the Shield Hero" Season 1: JP Subs, Simplified CN Subs, JP-CN Dual Subs​.
「盾の勇者の成り上がり」 第1期 日本語字幕／简体字字幕／日中双语字幕​。

<!-- more -->

## 「盾之勇者成名录」第一季简日双语字幕、日文字幕、中日字幕

![](https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20250618202141352.jpg)

#### 片名、译名

The Rising of the Shield Hero，盾之勇者成名录，盾の勇者の成り上がり。

#### 来源说明

简体中文字幕来自樱都字幕组。

#### 下载地址（Download link，ダウンロードリンク）

[Github](https://github.com/lwtdzh/imghost/blob/master/subs/%E7%9B%BE%E4%B9%8B%E5%8B%87%E8%80%85%E6%88%90%E5%90%8D%E5%BD%95%E7%AC%AC%E4%B8%80%E5%AD%A3.zip)
[Lanzou](https://wwqq.lanzoub.com/iF90I2z2kyrg)，密码：gwa3

#### 播放效果

![](https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20250618202748094.jpg)', 0);

INSERT OR REPLACE INTO articles (slug, title, date, updated, description, tags, cover, content, hidden)
VALUES ('2024/12/05/jpsub/eromanga', '「埃罗芒阿老师」简日双语字幕、日文字幕、中日字幕', '2024-12-05T21:29:30+08:00', '2025-06-18T21:07:19+08:00', '"Eromanga Sensei" dual-language subtitles (Japanese and Chinese), Japanese subtitles, and bilingual subtitles (Chinese and Japanese).「エロマンガ先生」二言語字幕（日本語と中国語）、日本語字幕、および中日字幕（中国語と日本語）。', '["中日双语字幕"]', 'https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20241219204910311.png', '"Eromanga Sensei" dual-language subtitles (Japanese and Chinese), Japanese subtitles, and bilingual subtitles (Chinese and Japanese).
「エロマンガ先生」二言語字幕（日本語と中国語）、日本語字幕、および中日字幕（中国語と日本語）。

<!-- more -->', 0);

INSERT OR REPLACE INTO articles (slug, title, date, updated, description, tags, cover, content, hidden)
VALUES ('2024/07/28/jpsub/gochiusa', '「请问您今天要来点兔子吗？」剧场版+OVA+TV 简日双语字幕、日文字幕、中日字幕', '2024-07-28T20:07:00+08:00', '2025-06-18T21:07:19+08:00', '"Is the Order a Rabbit?" dual-language subtitles (Japanese and Chinese), Japanese subtitles, and bilingual subtitles (Chinese and Japanese).「ご注文はうさぎですか？」二言語字幕（日本語と中国語）、日本語字幕、および中日字幕（中国語と日本語）。', '["中日双语字幕"]', 'https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20241219194006078.webp', '', 0);

INSERT OR REPLACE INTO articles (slug, title, date, updated, description, tags, cover, content, hidden)
VALUES ('2022/09/07/test/hello-world', 'Hello World', '2022-09-07T08:08:26+08:00', '2024-12-17T15:34:20+08:00', 'Hello World!', '["test"]', '', 'Hello World!

<!-- more -->

Welcome to [Hexo](https://hexo.io/)! This is your very first post. Check [documentation](https://hexo.io/docs/) for more info. If you get any problems when using Hexo, you can find the answer in [troubleshooting](https://hexo.io/docs/troubleshooting.html) or you can ask me on [GitHub](https://github.com/hexojs/hexo/issues).

## Quick Start

### Create a new post

```bash
$ hexo new "My New Post"
```

More info: [Writing](https://hexo.io/docs/writing.html)

### Run server

```bash
$ hexo server
```

More info: [Server](https://hexo.io/docs/server.html)

### Generate static files

```bash
$ hexo generate
```

More info: [Generating](https://hexo.io/docs/generating.html)

### Deploy to remote sites

```bash
$ hexo deploy
```

More info: [Deployment](https://hexo.io/docs/one-command-deployment.html)', 0);

INSERT OR REPLACE INTO articles (slug, title, date, updated, description, tags, cover, content, hidden)
VALUES ('2022/09/07/test/Image-Host-Test', '图床检测', '2022-09-07T16:15:30+08:00', '2025-06-18T21:07:19+08:00', '', '["test"]', 'https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20241216175657162.png', '## 文章说明

本文章用于检查博客的图床是否正常加载。如果下方标题下的图片能正常显示，则说明对应图床正常工作。

## 直连 Github 图床

部分地区可能无法直连 Github。  

![](https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20241216175657162.png)

## 直连 Cloudflare Workers

可能无法连接，因 Cloudflare Workers 域名被屏蔽。  

![](https://reverse-proxy-raw-githubusercontent-com.lwtdzh.workers.dev/lwtdzh/imghost/master/img/20241216175657162.png)

## 使用自定义域连接 Cloudflare Workers

理论上可以正常显示。  

![](https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20241216175657162.png)', 0);

INSERT OR REPLACE INTO articles (slug, title, date, updated, description, tags, cover, content, hidden)
VALUES ('2024/08/18/jpsub/k-on', '「轻音少女」第一季、第二季 简日双语字幕、日文字幕、中日双语字幕', '2024-08-18T15:12:27+08:00', '2025-06-18T21:07:19+08:00', '"Kin-iro Mosaic" dual-language subtitles (Japanese and Chinese), Japanese subtitles, and bilingual subtitles (Chinese and Japanese).「きんいろモザイク」二言語字幕（日本語と中国語）、日本語字幕、および中日字幕（中国語と日本語）。', '["中日双语字幕"]', 'https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20241219200128625.webp', '"Kin-iro Mosaic" dual-language subtitles (Japanese and Chinese), Japanese subtitles, and bilingual subtitles (Chinese and Japanese).
「きんいろモザイク」二言語字幕（日本語と中国語）、日本語字幕、および中日字幕（中国語と日本語）。

<!-- more -->', 0);

INSERT OR REPLACE INTO articles (slug, title, date, updated, description, tags, cover, content, hidden)
VALUES ('2024/08/17/jpsub/KinIroMosaic', '「黄金拼图」剧场版+TV版 简日双语字幕、日文字幕、中日双语字幕', '2024-08-17T16:54:00+08:00', '2025-06-18T21:07:19+08:00', '"Kin-iro Mosaic" dual-language subtitles (Japanese and Chinese), Japanese subtitles, and bilingual subtitles (Chinese and Japanese).「きんいろモザイク」二言語字幕（日本語と中国語）、日本語字幕、および中日字幕（中国語と日本語）。', '["中日双语字幕"]', 'https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20241219195506368.webp', '"Kin-iro Mosaic" dual-language subtitles (Japanese and Chinese), Japanese subtitles, and bilingual subtitles (Chinese and Japanese).
「きんいろモザイク」二言語字幕（日本語と中国語）、日本語字幕、および中日字幕（中国語と日本語）。

<!-- more -->', 0);

INSERT OR REPLACE INTO articles (slug, title, date, updated, description, tags, cover, content, hidden)
VALUES ('2024/06/14/jpsub/kobayashiS1', '「小林家的龙女仆」第一季简日双语字幕、日文字幕、中日字幕、繁日字幕', '2024-06-14T21:01:04+08:00', '2025-06-18T21:07:19+08:00', '「小林さんちのメイドラゴン」第1期の簡日バイリンガル字幕、日本語字幕、中日字幕、繁体字日本語字幕The first season of "Miss Kobayashi''s Dragon Maid" with simplified Chinese-Japanese bilingual subtitles, Japanese subtitles, Chinese-Japanese subtitles,', '["中日双语字幕"]', 'https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20241219193314975.jpg', '', 0);

INSERT OR REPLACE INTO articles (slug, title, date, updated, description, tags, cover, content, hidden)
VALUES ('2024/07/04/jpsub/kobayashiS2', '「小林家的龙女仆S」第二季简日双语字幕、日文字幕、中日字幕、繁日字幕', '2024-07-04T19:45:04+08:00', '2025-06-18T21:07:19+08:00', '「小林さんちのメイドラゴンS」第2期の簡日バイリンガル字幕、日本語字幕、中日字幕、繁体字日本語字幕The first season of "Miss Kobayashi''s Dragon Maid S" with simplified Chinese-Japanese bilingual subtitles, Japanese subtitles, Chinese-Japanese subtitl', '["中日双语字幕"]', 'https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20241219193314975.jpg', '', 0);

INSERT OR REPLACE INTO articles (slug, title, date, updated, description, tags, cover, content, hidden)
VALUES ('2024/09/17/jpsub/kyokosuiri', '「虚构推理」第一季 简日双语字幕、日文字幕、中日字幕', '2024-09-17T19:33:25+08:00', '2025-06-18T21:07:19+08:00', '"In Spectre" Season 1 dual-language subtitles (Japanese and Chinese), Japanese subtitles, and bilingual subtitles (Chinese and Japanese).「虚構推理」シーズン1 二言語字幕（日本語と中国語）、日本語字幕、および中日字幕（中国語と日本語）', '["中日双语字幕"]', 'https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20241219201932955.webp', '"In Spectre" Season 1 dual-language subtitles (Japanese and Chinese), Japanese subtitles, and bilingual subtitles (Chinese and Japanese).
「虚構推理」シーズン1 二言語字幕（日本語と中国語）、日本語字幕、および中日字幕（中国語と日本語）

<!-- more -->', 0);

INSERT OR REPLACE INTO articles (slug, title, date, updated, description, tags, cover, content, hidden)
VALUES ('2024/05/21/jpsub/The_Legendary_Hero_Is_Dead', '动画「勇者死了」日文字幕双语字幕简日字幕中日字幕', '2024-05-21T19:51:21+08:00', '2025-06-18T21:07:19+08:00', 'アニメ「勇者が死んだ！」日本語字幕、バイリンガル字幕、簡体字+日本語字幕、中日字幕The animation "The Legendary Hero Is Dead!" Japanese subtitles, bilingual subtitles, Simplified Chinese + Japanese subtitles, Chinese-Japanese subtitles.', '["中日双语字幕"]', 'https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20241219193414501.webp', '', 0);

INSERT OR REPLACE INTO articles (slug, title, date, updated, description, tags, cover, content, hidden)
VALUES ('2025/05/09/jpsub/loveliveS1', '「Love Live! School Idol Project」第一季 S1 简日双语字幕、日文字幕、中日字幕', '2025-05-09T20:40:10+08:00', '2025-05-09T20:47:50+08:00', '"Love Live! School Idol Project" Season 1 (S1) - Simplified Chinese & Japanese Bilingual Subtitles, Japanese Subtitles, Chinese-Japanese Subtitles「ラブライブ！ School Idol Project」第1期 S1 簡体字・日本語バイリンガル字幕、日本語字幕、中日字幕', '["中日双语字幕"]', 'https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20250509204216506.jpe', '"Love Live! School Idol Project" Season 1 (S1) - Simplified Chinese & Japanese Bilingual Subtitles, Japanese Subtitles, Chinese-Japanese Subtitles
「ラブライブ！ School Idol Project」第1期 S1 簡体字・日本語バイリンガル字幕、日本語字幕、中日字幕

<!-- more -->', 0);

INSERT OR REPLACE INTO articles (slug, title, date, updated, description, tags, cover, content, hidden)
VALUES ('2024/07/27/jpsub/miaonei', '「天使降临到我身边！」简日双语字幕、日文字幕、中日字幕', '2024-07-27T17:27:15+08:00', '2025-06-18T21:07:19+08:00', '"Wataten!: An Angel Flew Down to Me" dual-language subtitles (Japanese and Chinese), Japanese subtitles, and bilingual subtitles (Chinese and Japanese).「私に天使が舞い降りた！」二言語字幕（日本語と中国語）、日本語字幕、および中日字幕（中国語と日本', '["中日双语字幕"]', 'https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20241219192940665.jpg', '', 0);

INSERT OR REPLACE INTO articles (slug, title, date, updated, description, tags, cover, content, hidden)
VALUES ('2024/10/30/jpsub/shirobako', '「白箱 SHIROBAKO」简日双语字幕、日文字幕、中日字幕', '2024-10-30T20:59:45+08:00', '2025-06-18T21:07:19+08:00', '"SHIROBAKO" dual-language subtitles (Japanese and Chinese), Japanese subtitles, and bilingual subtitles (Chinese and Japanese).「SHIROBAKO」二言語字幕（日本語と中国語）、日本語字幕、および中日字幕（中国語と日本語）。', '["中日双语字幕"]', 'https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20241219202745029.webp', '"SHIROBAKO" dual-language subtitles (Japanese and Chinese), Japanese subtitles, and bilingual subtitles (Chinese and Japanese).
「SHIROBAKO」二言語字幕（日本語と中国語）、日本語字幕、および中日字幕（中国語と日本語）。

<!-- more -->', 0);

INSERT OR REPLACE INTO articles (slug, title, date, updated, description, tags, cover, content, hidden)
VALUES ('2025/03/17/jpsub/the-art', '中日双语字幕「这个美术社大有问题！」简日、日语字幕', '2025-03-17T21:14:11+08:00', '2025-06-18T21:07:19+08:00', '"Chinese-Japanese Bilingual Subtitles ''This Art Club Has a Problem!'' Simplified Japanese, Japanese Subtitles""中日二重字幕『この美術部には大きな問題がある！』簡体字日本語、日本語字幕"', '["中日双语字幕"]', 'https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20250317211626071.png', '"Chinese-Japanese Bilingual Subtitles ''This Art Club Has a Problem!'' Simplified Japanese, Japanese Subtitles"
「中日二重字幕『この美術部には大きな問題がある！』簡体字日本語、日本語字幕」

<!-- more -->', 0);

INSERT OR REPLACE INTO articles (slug, title, date, updated, description, tags, cover, content, hidden)
VALUES ('2024/12/19/rambling/thirty-years-old-write-to-myself', '2024/12/19，我满30岁，他们多大呢？', '2024-12-19T22:22:12+08:00', '2025-06-18T21:07:19+08:00', '盘点一些二次元人物今天的年龄。', '["rambling"]', 'https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20250116225928765.jpg', '盘点一些二次元人物今天的年龄。

<!-- more -->', 1);

