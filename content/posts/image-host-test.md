---
title: "图床检测"
date: "2022-09-07T16:15:30+08:00"
updated: "2025-06-18T21:07:19+08:00"
slug: "2022/09/07/test/Image-Host-Test"
tags: ["test"]
description: ""
cover: "https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20241216175657162.png"
hidden: false
---

## 文章说明

本文章用于检查博客的图床是否正常加载。如果下方标题下的图片能正常显示，则说明对应图床正常工作。

## 直连 Github 图床

部分地区可能无法直连 Github。  

![](https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20241216175657162.png)

## 直连 Cloudflare Workers

可能无法连接，因 Cloudflare Workers 域名被屏蔽。  

![](https://reverse-proxy-raw-githubusercontent-com.lwtdzh.workers.dev/lwtdzh/imghost/master/img/20241216175657162.png)

## 使用自定义域连接 Cloudflare Workers

理论上可以正常显示。  

![](https://raw.githubusercontent.com/lwtdzh/imghost/master/img/20241216175657162.png)
