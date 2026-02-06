# Respaldo DNS - iautomae.com

Estos son los registros que debemos configurar en Vercel inmediatamente después de cambiar los Nameservers en GoDaddy para que todo siga funcionando.

## Registros de Correo (Google Workspace)
| Tipo | Nombre | Valor | Prioridad |
| :--- | :--- | :--- | :--- |
| MX | @ | aspmx.l.google.com | 1 |
| MX | @ | alt1.aspmx.l.google.com | 5 |
| MX | @ | alt2.aspmx.l.google.com | 5 |
| MX | @ | alt3.aspmx.l.google.com | 10 |
| MX | @ | alt4.aspmx.l.google.com | 10 |

## Registros de Seguridad y Verificación (TXT)
| Tipo | Nombre | Valor |
| :--- | :--- | :--- |
| TXT | @ | google-site-verification=IhnPNRaPNVJUNDzkJglb4PoLskvQSEfvLcMizudsXIA |
| TXT | @ | v=spf1 include:dc-aa8e722993._spfm.iautomae.com ~all |
| TXT | dc-aa8e722993._spfm | v=spf1 include:_spf.google.com ~all |
| TXT | google._domainkey | v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5rv5... (valor largo) |
| TXT | _dmarc | v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onesecureserver.net; |

## Registros de Validación (CNAME)
*   **ACM Verification AWS**: `_413935f3f46a7d73bac4c038506834ff.www` -> `_990e5c27d7ca018131f3854770af902e.jkddzztszm.acm-validations.aws.`
