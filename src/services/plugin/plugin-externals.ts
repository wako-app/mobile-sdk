import * as core from '@angular/core';
import * as rxjs from 'rxjs';
import * as rxjsOperators from 'rxjs/operators';
import * as ionicStorage from '@ionic/storage';
import * as ngxTranslateCore from '@ngx-translate/core';
import * as common from '@angular/common';
import * as forms from '@angular/forms';
import * as router from '@angular/router';
import * as tslib from 'tslib';
import * as ionic from '@ionic/angular';

export const PLUGIN_EXTERNALS_MAP = {
  'ng.core': core,
  'ng.common': common,
  'ng.forms': forms,
  'ng.router': router,
  rxjs,
  'rxjs.operators': rxjsOperators,
  tslib,
  'ionic.storage': ionicStorage,
  'ionic.angular': ionic,
  'ngx-translate.core': ngxTranslateCore
};
