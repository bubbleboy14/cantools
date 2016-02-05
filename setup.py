from cantools import __version__
from setuptools import setup

setup(
    name='ct',
    version=__version__,
    author='Mario Balibrera',
    author_email='mario.balibrera@gmail.com',
    license='MIT License',
    description='Modern minimal web framework',
    long_description='This is the application-neutral backbone of CivilActionNetwork.org. It provides basic functions for interacting with the DOM, fixes for common browser inconsistencies, and a simple model for communication with a Python backend.',
    packages=[
        'cantools',
        'cantools.scripts'
    ],
    zip_safe = False,
    install_requires = [
        "rel >= 0.3.3",
        "dez >= 0.5.8.1",
        "yagmail >= 0.4.116",
        "requests >= 2.3.0"
        "slimit"
    ],
    entry_points = '''
        [console_scripts]
        ctstart = cantools:ctstart
        ctdeploy = cantools:ctdeploy
        ctpubsub = cantools:ctpubsub
        ctinit = cantools:ctinit
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
