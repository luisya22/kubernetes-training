# Release Checklist

Use this checklist when preparing a new release of the Kubernetes Training Application.

## Pre-Release

### Code Quality
- [ ] All tests pass: `npm test`
- [ ] No TypeScript errors: `npm run build`
- [ ] Code has been reviewed
- [ ] All critical bugs are fixed
- [ ] Performance is acceptable

### Version Management
- [ ] Update version in `package.json`
- [ ] Update CHANGELOG.md with release notes
- [ ] Update README.md if needed
- [ ] Commit version changes: `git commit -m "chore: bump version to X.Y.Z"`
- [ ] Create git tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`

### Content Verification
- [ ] All lesson files are present and valid JSON
- [ ] All exercise files are present and valid JSON
- [ ] All microservices have complete code and manifests
- [ ] Sample code has been tested
- [ ] Documentation is up to date

### Build Assets
- [ ] Icons are created for all platforms (Windows, macOS, Linux)
- [ ] Icons are properly sized and formatted
- [ ] Build resources are in place

## Building

### Pre-Build Checks
- [ ] Run pre-build verification: `node scripts/pre-build-check.js`
- [ ] All required directories exist
- [ ] All content is bundled correctly

### Platform Builds

#### Linux Build
- [ ] Build on Linux or macOS
- [ ] Run: `npm run package:linux`
- [ ] Verify AppImage is created
- [ ] Verify .deb package is created
- [ ] Test AppImage on Ubuntu/Debian
- [ ] Test .deb installation

#### macOS Build
- [ ] Build on macOS
- [ ] Run: `npm run package:mac`
- [ ] Verify .dmg for Intel (x64) is created
- [ ] Verify .dmg for Apple Silicon (arm64) is created
- [ ] Test installation on Intel Mac
- [ ] Test installation on Apple Silicon Mac
- [ ] Verify app launches without errors

#### Windows Build
- [ ] Build on Windows
- [ ] Run: `npm run package:win`
- [ ] Verify .exe installer is created
- [ ] Test installation on Windows 10
- [ ] Test installation on Windows 11
- [ ] Verify app launches without errors

## Testing

### Installation Testing
- [ ] Clean install on each platform
- [ ] Verify installer creates desktop shortcut
- [ ] Verify installer creates start menu entry (Windows)
- [ ] Verify app appears in Applications (macOS)
- [ ] Uninstall and verify clean removal

### Functionality Testing
- [ ] App launches successfully
- [ ] All lessons load correctly
- [ ] All exercises display properly
- [ ] Sample microservices are accessible
- [ ] Progress tracking works
- [ ] Settings can be configured
- [ ] Validation engine works with local cluster
- [ ] Docker integration works
- [ ] Kubernetes integration works

### Content Testing
- [ ] Beginner lessons are accessible
- [ ] Intermediate lessons are accessible
- [ ] Advanced lessons are accessible
- [ ] All code examples display correctly
- [ ] All diagrams render properly
- [ ] Exercise validation works

### Cross-Platform Testing
- [ ] Test on Windows 10
- [ ] Test on Windows 11
- [ ] Test on macOS Intel
- [ ] Test on macOS Apple Silicon
- [ ] Test on Ubuntu 20.04+
- [ ] Test on other Linux distributions (optional)

## Distribution

### GitHub Release
- [ ] Push tag to GitHub: `git push origin vX.Y.Z`
- [ ] GitHub Actions builds complete successfully
- [ ] Download artifacts from GitHub Actions
- [ ] Create GitHub Release
- [ ] Upload installers to release
- [ ] Write release notes
- [ ] Mark release as latest
- [ ] Publish release

### Release Notes
- [ ] List new features
- [ ] List bug fixes
- [ ] List breaking changes (if any)
- [ ] Include upgrade instructions
- [ ] List known issues
- [ ] Include system requirements
- [ ] Add installation instructions

### Documentation
- [ ] Update main README.md
- [ ] Update installation guide
- [ ] Update user documentation
- [ ] Update API documentation (if applicable)
- [ ] Update screenshots if UI changed

## Post-Release

### Verification
- [ ] Download installers from release page
- [ ] Verify checksums (if provided)
- [ ] Test installation from release artifacts
- [ ] Verify download links work

### Communication
- [ ] Announce release on project channels
- [ ] Update project website (if applicable)
- [ ] Post on social media (if applicable)
- [ ] Notify users of update

### Monitoring
- [ ] Monitor for bug reports
- [ ] Monitor download statistics
- [ ] Check for installation issues
- [ ] Respond to user feedback

### Cleanup
- [ ] Archive old releases (keep last 3-5)
- [ ] Clean up build artifacts locally
- [ ] Update project board/issues
- [ ] Plan next release

## Rollback Plan

If critical issues are discovered:

1. **Immediate Actions**
   - [ ] Mark release as pre-release or draft
   - [ ] Add warning to release notes
   - [ ] Communicate issue to users

2. **Fix and Re-release**
   - [ ] Create hotfix branch
   - [ ] Fix critical issue
   - [ ] Increment patch version
   - [ ] Follow release process again

3. **Revert Release**
   - [ ] Delete problematic release
   - [ ] Delete git tag
   - [ ] Revert to previous stable version
   - [ ] Communicate rollback to users

## Version Numbering

Follow Semantic Versioning (semver):

- **Major (X.0.0)**: Breaking changes, major new features
- **Minor (x.Y.0)**: New features, backward compatible
- **Patch (x.y.Z)**: Bug fixes, backward compatible

## Release Frequency

- **Patch releases**: As needed for critical bugs
- **Minor releases**: Every 4-6 weeks
- **Major releases**: Every 6-12 months

## Support Policy

- **Latest version**: Full support
- **Previous minor version**: Security fixes only
- **Older versions**: No support

## Notes

- Always test on clean systems, not development machines
- Keep installers for at least 3 previous versions
- Document any platform-specific issues
- Maintain changelog for all releases
- Consider beta releases for major changes
