# Keys and accounts custody (9.1.6)

Never put private keys, tokens, or recovery codes in the repo, chat, or email.

| Secret / account | Holder A | Holder B | Rotation |
| --- | --- | --- | --- |
| age private key | developer password manager | sister sealed envelope | test decrypt every 3 months |
| age public (`age1…`) | GitHub variable `AGE_RECIPIENT` | — | with key rotation |
| B2 login + keys | developer | sister knows account exists | 6 months |
| Cloudflare login + 2FA recovery | developer | sister sealed envelope copy | 6 months |
| GitHub | developer | — | 6 months tokens |
| Domain registrar | developer | sister | 6 months |
| Healthchecks | developer | — | if URL leaks, rotate check |
| Google staff OIDC client secret | Worker secret | — | 6 months |
| Clinic PC B2 read-only key | PC only | — | 6 months |

**Done when:** sister, following this guide and without the developer present, decrypts one dump on a safe machine and confirms the checksum. Note the date in STATE.md (not the key).
