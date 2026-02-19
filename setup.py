from setuptools import setup

setup(
    name='ct',
    version="0.10.8.120",
    author='Mario Balibrera',
    author_email='mario.balibrera@gmail.com',
    license='MIT License',
    description='Modern minimal web framework',
    long_description='This portable modern web framework is the application-neutral backbone of Civil Action Network. It includes: a pubsub WebSocket server and bot platform; swappable web backends capable of targeting high-concurrency standalone or cloud platforms; a variable-mode application compiler; a broad-spectrum ORM and database migration tools; a built in administrative interface; and a rich modular JavaScript library.',
    packages=[
        'cantools',
        'cantools.db',
        'cantools.db.gae',
        'cantools.scripts',
        'cantools.scripts.pubsub',
        'cantools.util',
        'cantools.util.ai',
        'cantools.util.ai.tox',
        'cantools.util.apper',
        'cantools.web'
    ],
    zip_safe = False,
    install_requires = [
        "babyweb >= 0.1.4.2",
        "venvr >= 0.1.5.8",
        "fyg >= 0.1.7.9",
        "rel >= 0.4.9.24",
        "dez >= 0.10.10.47",
        "catmail >= 0.1.9.1",
        "databae >= 0.2",
#        "jsmin >= 2.2.2",
#        "psutil >= 5.0.1",
#        "braintree >= 4.5.0",
    ],
    entry_points = '''
        [console_scripts]
        ctstart = cantools:ctstart
        ctdeploy = cantools:ctdeploy
        ctpubsub = cantools:ctpubsub
        ctinit = cantools:ctinit
        ctindex = cantools:ctindex
        ctmigrate = cantools:ctmigrate
        ctdoc = cantools:ctdoc
        ctbench = cantools:ctbench
        ctutil = cantools:ctutil
    ''',
    classifiers = [
        'Development Status :: 5 - Production/Stable',
        'Environment :: Console',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Topic :: Software Development :: Libraries :: Python Modules'
    ],
)
