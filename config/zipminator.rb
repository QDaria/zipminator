# Homebrew formula for Zipminator
# Install with: brew tap qdaria/zipminator https://github.com/qdaria/homebrew-zipminator
# Then: brew install zipminator

class Zipminator < Formula
  desc "Quantum-safe cryptography CLI with NIST Kyber768 and IBM QRNG"
  homepage "https://qdaria.com/technology/products/zipminator"
  url "https://github.com/qdaria/zipminator/archive/v0.1.0.tar.gz"
  sha256 "4b8a4e0e32e1d7f8c9a6b5e2d1c4a3f8e7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d"
  license "MIT"
  revision 1

  depends_on "rust" => :build
  depends_on "pkg-config" => :build

  def install
    system "cargo", "install",
           "--locked",
           "--root", prefix,
           "--path", "cli"
  end

  test do
    system "#{bin}/zipminator", "--version"
    system "#{bin}/zipminator", "--help"
  end
end
