# Module Verification Guide

This guide explains how to get the DDT Daggerheart & Gaming Module verified for use with ModuleDock.

## 📋 Verification Requirements

Before submitting your module for verification, ensure it meets all ModuleDock requirements:

### ✅ Required
- [x] Unique `module_id`: `ddt-daggerheart-gaming`
- [x] At least one command (we have 12!)
- [x] Clear description of functionality
- [x] Version number following semantic versioning
- [x] Complete manifest.json file
- [x] Module README with usage instructions

### ✅ Recommended
- [x] Clear command descriptions
- [x] Settings schema for configuration
- [x] Icon URL for visual identification
- [x] Comprehensive documentation

## 🔐 Verification Process

### Step 1: Prepare Your Submission

1. **Test your module thoroughly**
   - Ensure all commands work as expected
   - Test with various input parameters
   - Verify error handling

2. **Review the manifest**
   - Check all command definitions are accurate
   - Verify options match actual command behavior
   - Ensure settings schema is complete

3. **Prepare documentation**
   - Module README with clear usage instructions
   - Command examples
   - Configuration guide

### Step 2: Submit for Review

Contact the ModuleDock/Polymorph team to submit your module:

1. **Open a submission issue** on the ModuleDock repository
2. **Provide required information**:
   - Module name: DDT Daggerheart & Gaming Module
   - Module ID: `ddt-daggerheart-gaming`
   - Repository URL: https://github.com/Raindancer118/DDT-DiscordBot
   - Manifest URL: Link to hosted manifest.json
   - Version: 1.1.0
   - Author contact information

3. **Include in your submission**:
   - Link to this repository
   - Link to the manifest.json file
   - Brief description of the module's purpose
   - Any special requirements or dependencies

### Step 3: Code Review

The ModuleDock team will:

1. **Review code quality**
   - Check for security vulnerabilities
   - Verify best practices
   - Test functionality

2. **Validate manifest**
   - Ensure command definitions match implementation
   - Verify all required fields are present
   - Check settings schema validity

3. **Security audit**
   - Automated security scanning
   - Manual security review
   - Dependency vulnerability check

### Step 4: Signature & Publication

Once approved:

1. **Module signing**
   - Team will sign the module with official private key
   - Signature will be added to manifest.json
   - Replace `PLACEHOLDER_SIGNATURE_TO_BE_SIGNED_BY_OFFICIAL_TEAM`

2. **Database entry**
   - Module will be added to the modules table
   - `verified` flag set to `TRUE`
   - All commands registered in `module_commands` table

3. **Publication**
   - Module appears in ModuleDock store
   - Available for installation via `/modulestore`
   - Accessible through dashboard

## 📝 Post-Verification Updates

### Updating Your Module

When you need to update your module:

1. **Update version number** in manifest.json
2. **Document changes** in changelog
3. **Submit update** for re-verification
4. **New signature** will be generated

### Version Numbering

Follow semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Breaking changes or major rewrites
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

Current version: `1.1.0`

## 🔑 Signature Verification

The signature in manifest.json is created using:

1. **Cryptographic signing** with Ed25519
2. **Official private key** held by ModuleDock team
3. **Verification** happens during installation using public key

**Do not** attempt to create your own signature - it will fail verification.

## ⚠️ Important Notes

### Security
- Never include sensitive data in your module
- Don't hardcode tokens or API keys
- Use environment variables for secrets
- Respect user privacy

### Compatibility
- Ensure commands don't conflict with core bot commands
- Test in multiple server environments
- Handle edge cases gracefully
- Provide helpful error messages

### Maintenance
- Respond to issues promptly
- Keep documentation up to date
- Monitor for security vulnerabilities
- Update dependencies regularly

## 📞 Contact Information

For verification questions or issues:

- **ModuleDock Team**: [Contact method TBD]
- **Module Author**: Raindancer118
- **Repository**: https://github.com/Raindancer118/DDT-DiscordBot
- **Issues**: https://github.com/Raindancer118/DDT-DiscordBot/issues

## 📚 Additional Resources

- [ModuleDock Documentation](link-to-moduledock-docs)
- [Module Development Guide](link-to-dev-guide)
- [Security Best Practices](link-to-security-guide)
- [API Reference](link-to-api-docs)

---

**Status**: Awaiting Verification  
**Last Updated**: 2025-12-26  
**Version**: 1.1.0
