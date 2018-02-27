echo "determining platform"
if [ ${OSTYPE:0:6} = "darwin" ]
then
    echo "you've got a mac!"
    python -c 'import magic' || {
        echo "you need magic!"
        echo "checking for brew"
        which brew
        if [ $? -ne 0 ]
        then
            echo "you need brew!"
            /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
            echo "brew installed!"
        else
            echo "you've got it!"
        fi
        brew install libmagic
        echo "magic installed"
    }
elif [ $OSTYPE == "linux-gnu" ]
then
    echo "you've got linux -- great!"
    echo "determining compatibility"
    which apt
    if [ $? -ne 0 ]
    then
        echo "You don't have apt, which means you're not running"
        echo "Debian. This script is designed to install cantools"
        echo "and all dependencies on a clean Ubuntu system (fresh"
        echo "outta AWS or wherever). Unfortunately, you'll have to"
        echo "do it the old fashioned way :'(it's not that hard;)"
        echo "Maybe you can build a bootstrapper for your type of system?"
        echo "Good luck, sorry!"
        exit 126
    else
        echo "you're good to go!"
    fi

    echo "updating repos"
    sudo apt update

    echo "checking for python"
    which python
    if [ $? -ne 0 ]
    then
        echo "installing python"
        sudo apt install --yes python2.7 </dev/null
        echo "python installed"
    else
        echo "you got it"
    fi

    echo "installing other deps"
    sudo apt install --yes build-essential libssl-dev libffi-dev python-dev python-setuptools git </dev/null
else
    echo "uh-oh -- you've got" $OSTYPE
    echo "this script only knows about Debian and OSX"
    exit 126
fi

echo "checking for cantools"
if pwd | grep cantools;
then
    echo "installing right here right now"
    sudo python setup.py install
    sudo python setup.py develop
else
    python -c 'import cantools' || {
        echo "cloning (and hiding) and installing cantools"
        cd ~
        mkdir .ctp
        cd .ctp
        git clone https://github.com/bubbleboy14/cantools.git
        cd cantools
        sudo python setup.py install
        sudo python setup.py develop
        echo "cantools installed"
    }
fi

echo "installed cantools and all dependencies. happy coding."
echo "goodbye"