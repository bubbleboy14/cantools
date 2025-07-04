from .duck import duck # not currently working :'(
from .g4free import g4chat, g4image, gchatters
from .fzn import fzn

# pb
def pb(question, botname, appid, userkey):
	from pb_py import main as PB
	resp = PB.talk(userkey, appid, "aiaas.pandorabots.com", botname, question)["response"]
	return resp.split("[URL]")[0]

# wrapper
def tox(statement, identity="Anonymous", name=None, mood=None, asker=None, options=None):
	if identity in gchatters:
		return g4chat(statement, identity)
	return fzn(statement, identity, name, mood, asker, options)