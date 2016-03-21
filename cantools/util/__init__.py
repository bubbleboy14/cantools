from io import read, write, writejson
from reporting import set_log, close_log, log, set_error, error
from system import cp, sym, mkdir, rm, cmd
from data import getxls, gettsv, getcsv, getcsvmod, flatten, arr2csv, batch