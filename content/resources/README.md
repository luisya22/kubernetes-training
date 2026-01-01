# Kubernetes Training Resources

This directory contains additional learning resources and reference materials.

## Available Resources

### kubectl Cheat Sheet
**Files**: 
- `kubectl-cheat-sheet.pdf` - **Recommended** - Beautiful PDF format, ready to print or view
- `kubectl-cheat-sheet.md` - Markdown source file

A comprehensive reference guide covering all essential kubectl commands, including:
- Basic commands (get, describe, delete)
- Pod management
- Deployments and scaling
- Services and networking
- ConfigMaps and Secrets
- Debugging and troubleshooting
- RBAC and security
- Output formatting
- Useful aliases and tips

**How to use**:
- **PDF**: Open directly from the kubectl basics lesson in the app (recommended)
- **Markdown**: View in any markdown viewer or text editor
- **Print**: The PDF is formatted for easy printing as a reference card
- **Offline**: Keep a copy on your desktop for quick reference

## Accessing from the App

When you're in the **kubectl Command Line Basics** lesson, you'll see a resources section at the bottom with buttons to:
- 📕 **Open PDF** - Opens the PDF in your default PDF viewer
- 📝 **Open Markdown** - Opens the markdown file in your default editor

## Converting Markdown to PDF (if needed)

If you want to regenerate the PDF from the markdown:

### Option 1: Pandoc (Recommended)
```bash
pandoc kubectl-cheat-sheet.md -o kubectl-cheat-sheet.pdf
```

### Option 2: VS Code Extension
Install the "Markdown PDF" extension and right-click the file → "Markdown PDF: Export (pdf)"

### Option 3: Online Converter
Upload to https://www.markdowntopdf.com/ or similar services

## Contributing

To add new resources:
1. Create the resource file in this directory
2. Update this README
3. Add a reference in the relevant lesson file
4. Update the LessonViewer component if needed to display the resource
