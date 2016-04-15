from io import read, write, writejson
from reporting import set_log, close_log, log, set_error, error, start_timer, end_timer
from system import cp, sym, mkdir, rm, cmd
from data import getxls, gettsv, getcsv, getcsv_from_data, flatten, arr2csv, batch