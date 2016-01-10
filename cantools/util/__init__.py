from io import read, write, writejson
from reporting import set_log, close_log, log, error
from system import cp, sym, mkdir
from data import getxls, gettsv, getcsv, getcsvmod, flatten, arr2csv