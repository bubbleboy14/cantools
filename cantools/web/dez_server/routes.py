from ...util import read

url = None
static = {}
cb = {}

for line in read("app.yaml", True):
	if line.startswith("- url: "):
		url = line[7:].strip()
	elif url:
		if line.startswith("  static_dir: "):
			target = line[14:].strip()
			if "*" in url: # bad regex detection...
				static[url] = target
			else:
				url = url.rstrip("/")
				static[url] = static[url + "/"] = target
			url = None
		elif line.startswith("  script: "):
			cb[url] = line[10:].split(".")[0]
			url = None