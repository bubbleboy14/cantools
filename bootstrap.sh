echo determining platform
if echo OSTYPE | grep darwin; then
    echo you have a mac!
    echo checking for brew
    if which brew;
    then
        echo you have brew
    else
        echo you need brew!
        /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
        echo brew installed!
    fi
    paman=brew
elif which apt; then
    echo you have debian -- great!
    paman="sudo apt"
elif which pkg; then
    echo you have pkg - running bsd
    paman="env ASSUME_ALWAYS_YES=yes pkg"
else
    echo uh-oh -- you have $OSTYPE
    echo this script only knows about Debian and BSD and OSX
    exit 126
fi

for pacname in python3 git do
    echo checking for $pacname
    if which $pacname; then
        echo you have $pacname
    else
        echo installing $pacname
        $paman install $pacname
        echo $pacname installed
    fi
done

if echo $paman | grep brew; then
    python -c 'import magic' || {
        echo you need magic!
        brew install libmagic
        echo magic installed
    }
elif echo $paman | grep apt; then
    echo updating repos
    $paman update
    echo installing other deps
    $paman install --yes build-essential libssl-dev libffi-dev python3-dev python3-setuptools </dev/null
fi

echo ensuring pip present
python3 -m ensurepip

echo checking for cantools
if pwd | grep cantools; then
    echo installing right here right now
    pip3 install -e .
else
    python3 -c 'import cantools' || {
        echo cloning (and hiding) and installing cantools
        cd ~
        mkdir .ct
        cd .ct
        git clone https://github.com/bubbleboy14/cantools.git
        cd cantools
        pip3 install -e .
        echo cantools installed
    }
fi

echo installed cantools and all dependencies. happy coding.
echo goodbye
