# Hosting the Module Manifest

The ModuleDock system requires your module manifest to be hosted at a publicly accessible URL. This guide explains how to host your manifest.json file.

## 📦 Hosting Options

### Option 1: GitHub Pages (Recommended for Open Source)

1. **Enable GitHub Pages** for your repository
2. **Create a `docs` folder** or use the `gh-pages` branch
3. **Place manifest.json** in the appropriate location
4. **Update manifest_url** in manifest.json to point to:
   ```
   https://<username>.github.io/<repository>/module/manifest.json
   ```

**Example for this module**:
```
https://raindancer118.github.io/DDT-DiscordBot/module/manifest.json
```

### Option 2: GitHub Raw Content

Use GitHub's raw content URL:

```
https://raw.githubusercontent.com/Raindancer118/DDT-DiscordBot/main/module/manifest.json
```

**Note**: This URL points directly to the file in your repository.

### Option 3: Custom Domain/CDN

If you have your own hosting:

1. **Upload manifest.json** to your web server
2. **Enable CORS** headers for cross-origin requests
3. **Use HTTPS** for security
4. **Update manifest_url** accordingly

Example:
```
https://modules.yourdomain.com/ddt-daggerheart-gaming/manifest.json
```

### Option 4: Cloud Storage (S3, Google Cloud Storage, etc.)

1. **Create a public bucket**
2. **Upload manifest.json**
3. **Set appropriate CORS policies**
4. **Get the public URL**

## 🔧 CORS Configuration

Your manifest must be accessible via CORS. Add these headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
Content-Type: application/json
```

## 📝 Manifest URL Format

The `manifest_url` in your manifest.json should:
- Use HTTPS protocol
- Be publicly accessible
- Return JSON content type
- Allow CORS requests
- Be stable (don't change URLs frequently)

## ✅ Testing Your Manifest URL

Test that your manifest is accessible:

### Using curl
```bash
curl -H "Origin: https://example.com" -I https://your-manifest-url/manifest.json
```

### Using a browser
Simply navigate to the URL - you should see the JSON content.

### Using the ModuleDock validator
```bash
# Example validation command (if available)
moduledock validate https://your-manifest-url/manifest.json
```

## 🔄 Updating the Manifest

When you update your module:

1. **Update version** in manifest.json
2. **Commit changes** to repository
3. **Push to main branch**
4. **Verify URL** still works
5. **Submit for re-verification** if needed

## 📋 Current Configuration

For this module, update the `manifest_url` field in manifest.json:

```json
{
  "manifest_url": "UPDATE_THIS_URL_AFTER_HOSTING"
}
```

**Recommended URL** (using GitHub Pages):
```
https://raindancer118.github.io/DDT-DiscordBot/module/manifest.json
```

Or (using GitHub raw):
```
https://raw.githubusercontent.com/Raindancer118/DDT-DiscordBot/main/module/manifest.json
```

## 🔐 Security Considerations

- **Never include secrets** in manifest.json
- **Use HTTPS** only (not HTTP)
- **Validate JSON** before hosting
- **Monitor access logs** for unusual activity
- **Keep backups** of all versions

## 📊 Monitoring

Monitor your manifest URL:
- Check uptime regularly
- Monitor for 404 errors
- Verify CORS headers
- Track version downloads

## 🆘 Troubleshooting

### Manifest not loading
- Verify URL is publicly accessible
- Check CORS headers
- Ensure JSON is valid
- Verify HTTPS is working

### ModuleDock can't fetch manifest
- Check firewall rules
- Verify CDN configuration
- Test with curl
- Check DNS propagation

### Version not updating
- Clear CDN cache
- Verify file was updated
- Check timestamp
- Wait for propagation

## 📞 Need Help?

If you have issues hosting your manifest:
- Open an issue on GitHub
- Contact ModuleDock support
- Check community forums
- Review documentation

---

**Current Status**: Manifest needs to be hosted  
**Next Steps**: Choose a hosting option and update manifest_url
