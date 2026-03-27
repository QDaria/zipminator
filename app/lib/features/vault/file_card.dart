import 'package:flutter/material.dart';
import 'package:zipminator/core/providers/vault_provider.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// A card displaying a single encrypted vault file.
class FileCard extends StatelessWidget {
  final VaultFile file;
  final VoidCallback? onTap;
  final VoidCallback? onShare;
  final VoidCallback? onDecrypt;

  const FileCard({
    super.key,
    required this.file,
    this.onTap,
    this.onShare,
    this.onDecrypt,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: QuantumCard(
        glowColor: QuantumTheme.quantumCyan,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            // File type icon
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: QuantumTheme.surfaceElevated,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: QuantumTheme.quantumCyan.withValues(alpha: 0.2),
                ),
              ),
              child: Icon(
                _iconForExtension(_extension(file.name)),
                color: _colorForExtension(_extension(file.name)),
                size: 22,
              ),
            ),
            const SizedBox(width: 12),

            // File details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    file.name,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${formatBytes(file.originalSize)} -> ${formatBytes(file.encryptedSize)} '
                    '| ${_relativeDate(file.encryptedAt)}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.5),
                          fontSize: 11,
                        ),
                  ),
                ],
              ),
            ),

            // Quick-action buttons
            _QuickActionButton(
              icon: Icons.lock_open,
              color: QuantumTheme.quantumCyan,
              tooltip: 'Decrypt',
              onTap: onDecrypt,
            ),
            const SizedBox(width: 4),
            _QuickActionButton(
              icon: Icons.share,
              color: QuantumTheme.quantumPurple,
              tooltip: 'Share',
              onTap: onShare,
            ),
            const SizedBox(width: 4),

            // PQC badge (compact)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
              decoration: BoxDecoration(
                color: QuantumTheme.quantumGreen.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(5),
                border: Border.all(
                  color: QuantumTheme.quantumGreen.withValues(alpha: 0.3),
                ),
              ),
              child: Text(
                'PQC',
                style: TextStyle(
                  color: QuantumTheme.quantumGreen,
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  static String _extension(String filename) {
    final dot = filename.lastIndexOf('.');
    if (dot < 0 || dot == filename.length - 1) return '';
    return filename.substring(dot + 1).toLowerCase();
  }

  static IconData _iconForExtension(String ext) {
    switch (ext) {
      case 'pdf':
        return Icons.picture_as_pdf;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'svg':
      case 'bmp':
        return Icons.image;
      case 'mp4':
      case 'mov':
      case 'avi':
      case 'mkv':
        return Icons.videocam;
      case 'mp3':
      case 'wav':
      case 'aac':
      case 'flac':
      case 'ogg':
        return Icons.audiotrack;
      case 'doc':
      case 'docx':
      case 'txt':
      case 'rtf':
      case 'md':
        return Icons.description;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return Icons.table_chart;
      case 'ppt':
      case 'pptx':
        return Icons.slideshow;
      case 'zip':
      case 'tar':
      case 'gz':
      case '7z':
      case 'rar':
        return Icons.folder_zip;
      case 'json':
      case 'xml':
      case 'yaml':
      case 'yml':
      case 'toml':
        return Icons.data_object;
      case 'dart':
      case 'rs':
      case 'py':
      case 'js':
      case 'ts':
      case 'java':
      case 'cpp':
      case 'c':
      case 'h':
        return Icons.code;
      default:
        return Icons.insert_drive_file;
    }
  }

  static Color _colorForExtension(String ext) {
    switch (ext) {
      case 'pdf':
        return const Color(0xFFFF5252);
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'svg':
        return const Color(0xFF7C4DFF);
      case 'mp4':
      case 'mov':
      case 'avi':
        return const Color(0xFFFF9100);
      case 'mp3':
      case 'wav':
      case 'aac':
        return const Color(0xFFE040FB);
      case 'doc':
      case 'docx':
      case 'txt':
        return const Color(0xFF448AFF);
      case 'xls':
      case 'xlsx':
      case 'csv':
        return const Color(0xFF00E676);
      case 'zip':
      case 'tar':
      case 'gz':
        return const Color(0xFFFFD740);
      default:
        return QuantumTheme.quantumCyan;
    }
  }

  /// Whether [filename] is a raster image format suitable for inline preview.
  static bool isPreviewableImage(String filename) {
    const exts = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'};
    return exts.contains(_extension(filename));
  }

  static String _relativeDate(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inSeconds < 60) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}';
  }
}

/// Small icon button used as a quick action on a [FileCard].
class _QuickActionButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String tooltip;
  final VoidCallback? onTap;

  const _QuickActionButton({
    required this.icon,
    required this.color,
    required this.tooltip,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
        child: InkWell(
          borderRadius: BorderRadius.circular(8),
          onTap: onTap,
          child: SizedBox(
            width: 32,
            height: 32,
            child: Icon(icon, color: color, size: 16),
          ),
        ),
      ),
    );
  }
}

/// Format byte count to human-readable string.
String formatBytes(int bytes) {
  if (bytes < 1024) return '$bytes B';
  if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
  if (bytes < 1024 * 1024 * 1024) {
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
  return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
}
