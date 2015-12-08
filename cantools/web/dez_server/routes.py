from ...scripts.util import read

url = None
static = {}
cb = {}

for line in read("app.yaml", True):
	if line.startswith("- url: "):
		url = line[7:].strip()
	elif url:
		if line.startswith("  static_dir: "):
			if not url.endswith("/") and "*" not in url:
				url += "/"
			static[url] = line[14:].strip()
			url = None
		elif line.startswith("  script: "):
			cb[url] = line[10:].split(".")[0]
			url = None