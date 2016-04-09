from setuptools import setup

setup(
    name='ct',
    version="0.6.5.4",
    author='Mario Balibrera',
    author_email='mario.balibrera@gmail.com',
    license='MIT License',
    description='Modern minimal web framework',
    long_description='This is the application-neutral backbone of CivilActionNetwork.org. It provides basic functions for interacting with the DOM, fixes for common browser inconsistencies, and a simple model for communication with a Python backend.',
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
        "rel >= 0.3.4",
        "dez >= 0.5.12",
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
