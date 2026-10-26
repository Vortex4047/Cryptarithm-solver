"""Cryptarithm Lab — Modern Desktop Application
Built with PySide6, QtWebEngine, and QWebChannel.
"""

from pathlib import Path
import sys

from PySide6.QtCore import QCoreApplication, QUrl
from PySide6.QtGui import QColor, QIcon
from PySide6.QtWebChannel import QWebChannel
from PySide6.QtWebEngineCore import QWebEngineSettings
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWidgets import QApplication, QMainWindow

from bridge.api_bridge import CryptarithmBridge


class CryptarithmMainWindow(QMainWindow):
    """Main desktop application window for Cryptarithm Lab."""

    def __init__(self):
        super().__init__()

        self.setWindowTitle("Cryptarithm Lab: Constraint Satisfaction Solver & Learning Suite")
        self.resize(1300, 860)
        self.setMinimumSize(960, 640)

        # Base directories
        base_dir = Path(__file__).resolve().parent
        ui_path = base_dir / "ui" / "index.html"

        # Initialize WebEngine and View
        self.web_view = QWebEngineView(self)
        self.setCentralWidget(self.web_view)

        # Configure WebEngine Settings
        settings = self.web_view.settings()
        settings.setAttribute(QWebEngineSettings.WebAttribute.JavascriptEnabled, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessRemoteUrls, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessFileUrls, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.ScrollAnimatorEnabled, True)

        # Set background color to match dark ground token
        self.web_view.page().setBackgroundColor(QColor("#171719"))

        # Setup QWebChannel bridge
        self.channel = QWebChannel(self.web_view.page())
        self.bridge = CryptarithmBridge(self)
        self.channel.registerObject("pyBridge", self.bridge)
        self.web_view.page().setWebChannel(self.channel)

        # Load local HTML UI
        if ui_path.exists():
            self.web_view.setUrl(QUrl.fromLocalFile(str(ui_path)))
        else:
            raise FileNotFoundError(f"UI file not found: {ui_path}")


def main():
    """Application entry point."""
    QCoreApplication.setApplicationName("Cryptarithm Lab")
    QCoreApplication.setOrganizationName("CryptarithmLab")

    app = QApplication(sys.argv)

    window = CryptarithmMainWindow()
    window.show()

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
