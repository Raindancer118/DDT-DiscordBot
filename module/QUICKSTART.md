# Quick Start Guide - ModuleDock Module

This guide will help you quickly prepare your DDT module for ModuleDock deployment.

## 📦 Prerequisites

Before submitting your module:

- [ ] All commands are tested and working
- [ ] Documentation is complete and accurate
- [ ] Module is ready for production use
- [ ] You have a place to host the manifest.json

## 🚀 Deployment Steps

### Step 1: Host the Manifest

Choose one of these hosting options:

#### Option A: GitHub Pages (Recommended)

1. Enable GitHub Pages in repository settings
2. Set source to `main` branch, `/` (root) folder
3. Your manifest will be available at:
   ```
   https://<username>.github.io/<repo>/module/manifest.json
   ```

#### Option B: GitHub Raw

Use the raw GitHub URL:
```
https://raw.githubusercontent.com/Raindancer118/DDT-DiscordBot/main/module/manifest.json
```

### Step 2: Update Manifest URLs

Edit `module/manifest.json` and update these fields:

```json
{
  "manifest_url": "https://your-actual-url.com/module/manifest.json",
  "icon_url": "https://your-actual-url.com/module/icon.svg"
}
```

**Example** (using GitHub Pages):
```json
{
  "manifest_url": "https://raindancer118.github.io/DDT-DiscordBot/module/manifest.json",
  "icon_url": "https://raindancer118.github.io/DDT-DiscordBot/module/icon.svg"
}
```

### Step 3: Validate Your Module

Run the validation script:

```bash
npm run validate-module
```

Fix any errors that appear. Warnings are okay but should be addressed before submission.

### Step 4: Test Manifest Access

Verify your manifest is publicly accessible:

```bash
# Test with curl
curl https://your-manifest-url/manifest.json

# Should return your manifest JSON
```

### Step 5: Prepare Submission

Create a submission document with:

1. **Module Information**
   - Name: DDT Daggerheart & Gaming Module
   - ID: ddt-daggerheart-gaming
   - Version: 1.1.0
   - Author: Raindancer118

2. **URLs**
   - Repository: https://github.com/Raindancer118/DDT-DiscordBot
   - Manifest: [your manifest URL]
   - Icon: [your icon URL]
   - Documentation: [your docs URL]

3. **Description**
   ```
   A comprehensive gaming module featuring Daggerheart RPG dice rolling tools 
   and a full suite of casino games including blackjack, poker, roulette, slots, 
   dice, baccarat, war, and coin flip. Includes 12 commands and 4 configurable 
   settings.
   ```

4. **Commands Summary**
   - `/dh` - Daggerheart dice rolling
   - `/blackjack`, `/poker`, `/roulette`, `/slots`, `/dice`, `/baccarat`, `/war` - Casino games
   - `/coinflip` - Coin flip
   - `/status`, `/login`, `/clear` - Utility commands

### Step 6: Submit for Verification

Contact the ModuleDock team:

1. Open an issue on the ModuleDock repository (or use their submission process)
2. Include all information from Step 5
3. Wait for code review feedback
4. Address any requested changes
5. Receive signature and verification

### Step 7: Post-Verification

Once approved:

1. ModuleDock team will provide the signature
2. Update `module/manifest.json` with the official signature
3. Commit and push changes
4. Module will appear in the ModuleDock store
5. Users can install it via dashboard or `/modulestore`

## 🔧 Maintenance

### Updating Your Module

When you need to release an update:

1. Make your code changes
2. Update version in `module/manifest.json` (follow semver)
3. Update documentation
4. Validate with `npm run validate-module`
5. Commit and push changes
6. Submit update for re-verification (if needed)
7. Receive new signature

### Version Numbering

Follow semantic versioning:
- **PATCH** (1.1.X): Bug fixes, no new features
- **MINOR** (1.X.0): New features, backward compatible
- **MAJOR** (X.0.0): Breaking changes

## ✅ Pre-Submission Checklist

Before submitting, verify:

- [ ] Manifest is hosted and publicly accessible
- [ ] Icon is hosted and publicly accessible
- [ ] All URLs use HTTPS
- [ ] Validation script passes (`npm run validate-module`)
- [ ] All commands tested and working
- [ ] Documentation is complete
- [ ] README includes usage examples
- [ ] Settings are properly documented
- [ ] No placeholder URLs in manifest
- [ ] Version follows semantic versioning

## 🆘 Troubleshooting

### Manifest not accessible
- Check CORS headers on your server
- Verify URL is correct and public
- Test with `curl -I [manifest-url]`

### Validation fails
- Run `npm run validate-module` for details
- Fix errors shown in output
- Check JSON syntax is valid

### Icons not displaying
- Verify icon URL is publicly accessible
- Use SVG format (recommended) or PNG
- Check CORS headers allow cross-origin requests

## 📚 Additional Resources

- [Full Module Documentation](README.md)
- [Integration Guide](INTEGRATION.md)
- [Verification Guide](VERIFICATION.md)
- [Hosting Guide](HOSTING.md)

## 📞 Need Help?

- GitHub Issues: https://github.com/Raindancer118/DDT-DiscordBot/issues
- ModuleDock Support: [link-tbd]
- Documentation: [link-tbd]

---

**Quick Start Version**: 1.0  
**Last Updated**: 2025-12-26
