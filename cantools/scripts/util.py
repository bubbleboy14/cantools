"""
### Usage: ctutil [module] [function] [..parameters]

### Options:
    -h, --help            show this help message and exit
"""

from optparse import OptionParser
from cantools import util
log = util.log
error = util.error

def run():
	parser = OptionParser("ctutil [module] [function] [..parameters]")
	args = parser.parse_args()[1]
	args or error("what module?")
	module = args.pop(0)
	args or error("what function?")
	function = args.pop(0)
	#log("calling %s.%s(%s)"%(module, function, ", ".join(args)))
	getattr(getattr(util, module), function)(*args)

if __name__ == "__main__":
	run()