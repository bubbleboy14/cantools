from setuptools import setup
setup(
    name='dez',
    version='0.2',
    author='Mario Balibrera',
    author_email='mario.balibrera@gmail.com',
    license='MIT License',
    description='',
    long_description='',
    packages=[
        'cantools'
    ],
    zip_safe = False,
    install_requires = [
        "rel >= 0.3.1",
        "dez >= 0.5.4.1"
    ],
    entry_points = '''
        [console_scripts]
        ctstart = cantools.start:go
        ctdeploy = cantools.deploy:run
        ctpubsub = cantools.pubsub:get_addr_and_start
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
