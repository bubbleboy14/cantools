from setuptools import setup

setup(
    name='ct',
    version="0.10.8.93",
    author='Mario Balibrera',
    author_email='mario.balibrera@gmail.com',
    license='MIT License',
    description='Modern minimal web framework',
    long_description='This portable modern web framework is the application-neutral backbone of Civil Action Network. It includes: a pubsub WebSocket server and bot platform; swappable web backends capable of targeting high-concurrency standalone or cloud platforms; a variable-mode application compiler; a broad-spectrum ORM and database migration tools; a built in administrative interface; and a rich modular JavaScript library.',
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
        "rel >= 0.4.2",
        "dez >= 0.10.9.35",
        "yagmail >= 0.6.161",
        "requests >= 2.3.0",
        "jsmin >= 2.2.2",
        "sqlalchemy >= 1.0.12",
        "psutil >= 5.0.1",
        "braintree >= 4.5.0",
        "six >= 1.12.0"
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
