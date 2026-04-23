this project is deployed to cloudflare pages, with the domain: https://blog-lwtdzh.pages.dev, https://blog.lwtdzh.ip-ddns.com (2 links target the same source).

this is the cloudflare deploy hook for this project: https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/9edc0c71-4b45-4183-bf6d-e1ef6277a2f2, after pushed a new commit to github, use this hook to trigger the cloudflare pages auto-deploy, after several seconds, above page on cloudflare would be updated by the newest commit.

