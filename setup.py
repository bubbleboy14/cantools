from setuptools import setup

setup(
    name='ct',
    version="0.6.7.1",
    author='Mario Balibrera',
    author_email='mario.balibrera@gmail.com',
    license='MIT License',
    description='Modern minimal web framework',
    long_description='This portable modern web framework is the application-neutral backbone of Civil Action Network. It includes: a pubsub WebSocket server and bot platform; swappable web backends capable of targeting high-concurrency standalone or cloud platforms; a variable-mode application compiler; a broad-spectrum ORM; a built in administrative interface; and a rich modular JavaScript library.',
    packages=[
        'cantools',
        'cantools.db',
        'cantools.db.gae',
        'cantools.db.sql',
        'cantools.scripts',
        'cantools.scripts.pubsub',
        'cantools.util',
        'cantools.web',
        'cantools.web.dez_server'
    ],
    zip_safe = False,
    install_requires = [
        "rel >= 0.3.5",
        "dez >= 0.5.12.1",
        "yagmail >= 0.4.116",
        "requests >= 2.3.0",
        "slimit",
        "sqlalchemy >= 1.0.12"
    ],
    entry_points = '''
        [console_scripts]
        ctstart = cantools:ctstart
        ctdeploy = cantools:ctdeploy
        ctpubsub = cantools:ctpubsub
        ctinit = cantools:ctinit
        ctindex = cantools:ctindex
    ''',
    classifiers = [
        'Development Status :: 3 - Alpha',
        'Environment :: Console',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Topic :: Software Development :: Libraries :: Python Modules'
    ],
)
