"""Standalone header fixer utility for markdown documents"""
import difflib
from pathlib import Path
from typing import Optional

import typer


class HeaderFixer:
    """Utility class for fixing markdown headers"""
    
    def __init__(self, keywords_to_fix: Optional[list[str]] = None):
        self.keywords_to_fix = keywords_to_fix or [
            "Examples", 
            "Arguments", 
            "Returns", 
            "Panics", 
            "Overflow Behavior", 
            "Note", 
            "Warning", 
            "See Also",
            "Parameters",
            "Usage",
            "Implementation Notes",
            "Error Handling"
        ]
    
    def fix_headers(self, content: str) -> str:
        """Fix headers that should be subsections of their parent headers"""
        lines = content.split('\n')
        fixed_lines = []
        current_parent_level = 1  # Track the level of the last seen proper header

        for _i, line in enumerate(lines):
            # Check if this is a header line
            if line.strip().startswith('#'):
                # Count the number of # characters
                header_level = len(line) - len(line.lstrip('#'))
                header_text = line.lstrip('#').strip()

                # Check if this line is a header that should be demoted
                if header_level == 1 and any(keyword in header_text for keyword in self.keywords_to_fix):
                    # Convert to one level deeper than the current parent
                    new_level = current_parent_level + 1
                    fixed_line = '#' * new_level + ' ' + header_text
                    fixed_lines.append(fixed_line)
                else:
                    # This is a normal header, update the parent level if appropriate
                    if not any(keyword in header_text for keyword in self.keywords_to_fix):
                        current_parent_level = header_level
                    fixed_lines.append(line)
            else:
                fixed_lines.append(line)

        return '\n'.join(fixed_lines)
    
    def display_diff(self, original: str, fixed: str) -> None:
        """Display a git-style diff between original and fixed content"""
        original_lines = original.splitlines(keepends=True)
        fixed_lines = fixed.splitlines(keepends=True)
        
        diff = difflib.unified_diff(
            original_lines,
            fixed_lines,
            fromfile='original',
            tofile='fixed',
            lineterm=''
        )
        
        diff_output = list(diff)
        if not diff_output:
            typer.echo("No changes detected.")
            return
            
        typer.echo("\n" + typer.style("Header Fix Diff:", fg=typer.colors.YELLOW, bold=True))
        typer.echo("=" * 60)
        
        for line in diff_output:
            if line.startswith('---') or line.startswith('+++'):
                typer.echo(typer.style(line, fg=typer.colors.BLUE))
            elif line.startswith('@@'):
                typer.echo(typer.style(line, fg=typer.colors.CYAN))
            elif line.startswith('-'):
                typer.echo(typer.style(line, fg=typer.colors.RED))
            elif line.startswith('+'):
                typer.echo(typer.style(line, fg=typer.colors.GREEN))
            else:
                typer.echo(line)
        
        typer.echo("=" * 60 + "\n")
    
    def process_file(self, input_path: Path, output_path: Optional[Path] = None, interactive: bool = True) -> bool:
        """Process a markdown file and fix headers
        
        Args:
            input_path: Path to the input markdown file
            output_path: Path to save the fixed file (if None, overwrites input)
            interactive: Whether to ask for user confirmation
            
        Returns:
            bool: True if changes were made and saved, False otherwise
        """
        # Read the input file
        original_content = input_path.read_text()
        
        # Fix headers
        fixed_content = self.fix_headers(original_content)
        
        # Check if there are changes
        if original_content == fixed_content:
            typer.echo("No header fixes needed.")
            return False
        
        # Display diff
        self.display_diff(original_content, fixed_content)
        
        # Determine output path
        if output_path is None:
            output_path = input_path
        
        # Ask for confirmation if interactive
        if interactive:
            if typer.confirm("Do you want to apply the header fixes?", default=True):
                output_path.write_text(fixed_content)
                typer.echo(typer.style(f"✓ Header fixes applied to: {output_path}", fg=typer.colors.GREEN))
                return True
            typer.echo(typer.style("✗ No changes made.", fg=typer.colors.YELLOW))
            return False
        # Non-interactive mode: always apply fixes
        output_path.write_text(fixed_content)
        typer.echo(typer.style(f"✓ Header fixes applied to: {output_path}", fg=typer.colors.GREEN))
        return True