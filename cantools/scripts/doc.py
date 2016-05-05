import os
from cantools import __version__, config
from cantools.util import write

def build():
	ds = config.about%(__version__,)
	write(ds, os.path.join("..", "..", "README.md"))

if __name__ == "__main__":
	build()