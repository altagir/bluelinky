/**
 * bluelinky (https://github.com/hacksore/bluelinky)
 *
 * The MIT License (MIT)
 * 
 * Copyright (c) 2019 hacksore
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var got = _interopDefault(require('got'));
var FormData = _interopDefault(require('form-data'));
var EventEmitter = _interopDefault(require('events'));

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

const endpoints = {
    getToken: 'https://owners.hyundaiusa.com/etc/designs/ownercommon/us/token.json?reg=',
    validateToken: 'https://owners.hyundaiusa.com/libs/granite/csrf/token.json',
    auth: 'https://owners.hyundaiusa.com/bin/common/connectCar',
    remoteAction: 'https://owners.hyundaiusa.com/bin/common/remoteAction',
    usageStats: 'https://owners.hyundaiusa.com/bin/common/usagestats',
    health: 'https://owners.hyundaiusa.com/bin/common/VehicleHealthServlet',
    messageCenter: 'https://owners.hyundaiusa.com/bin/common/MessageCenterServlet',
    myAccount: 'https://owners.hyundaiusa.com/bin/common/MyAccountServlet',
    status: 'https://owners.hyundaiusa.com/bin/common/enrollmentFeature',
    enrollmentStatus: 'https://owners.hyundaiusa.com/bin/common/enrollmentStatus',
    subscriptions: 'https://owners.hyundaiusa.com/bin/common/managesubscription'
};
function buildFormData(config) {
    const form = new FormData();
    for (const key in config) {
        const value = config[key];
        if (typeof value !== 'object') {
            form.append(key, value.toString());
        }
    }
    return form;
}
class Vehicle {
    constructor(config) {
        this._currentFeatures = {};
        this._vin = config.vin;
        this._pin = config.pin;
        this._eventEmitter = new EventEmitter();
        this._bluelinky = config.bluelinky;
        this.onInit();
    }
    addFeature(featureName, state) {
        this._currentFeatures[featureName] = (state === 'ON' ? true : false);
    }
    onInit() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.features();
            if (response.result === 'E:Failure' || response.result !== undefined) {
                response.result.forEach(item => {
                    this.addFeature(item.featureName, item.featureStatus);
                });
            }
            // we tell the vehicle it's loaded :D
            this._eventEmitter.emit('ready');
        });
    }
    get vin() {
        return this._vin;
    }
    get eventEmitter() {
        return this._eventEmitter;
    }
    hasFeature(featureName) {
        return this._currentFeatures[featureName];
    }
    getFeatures() {
        return this._currentFeatures;
    }
    unlock() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasFeature('DOOR UNLOCK')) {
                throw new Error('Vehicle does not have the unlock feature');
            }
            const formData = {
                gen: 2,
                regId: this.vin,
                service: 'remoteunlock'
            };
            const response = yield this._request(endpoints.remoteAction, formData);
            return {
                result: response.RESPONSE_STRING,
                status: response.E_IFRESULT,
                errorMessage: response.E_IFFAILMSG
            };
        });
    }
    lock() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasFeature('DOOR LOCK')) {
                throw new Error('Vehicle does not have the lock feature');
            }
            const response = yield this._request(endpoints.remoteAction, {
                gen: 2,
                regId: this.vin,
                service: 'remotelock'
            });
            return {
                result: response.RESPONSE_STRING,
                status: response.E_IFRESULT,
                errorMessage: response.E_IFFAILMSG
            };
        });
    }
    start(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this._request(endpoints.remoteAction, Object.assign({ gen: 2, regId: this.vin, service: 'ignitionstart' }, config));
            return {
                result: response.RESPONSE_STRING,
                status: response.E_IFRESULT,
                errorMessage: response.E_IFFAILMSG
            };
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this._request(endpoints.remoteAction, {
                gen: 2,
                regId: this.vin,
                service: 'ignitionstop'
            });
            return {
                result: response.RESPONSE_STRING,
                status: response.E_IFRESULT,
                errorMessage: response.E_IFFAILMSG
            };
        });
    }
    flashLights() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this._request(endpoints.remoteAction, {
                gen: 2,
                regId: this.vin,
                service: 'light'
            });
            return {
                result: response.RESPONSE_STRING,
                status: response.E_IFRESULT,
                errorMessage: response.E_IFFAILMSG
            };
        });
    }
    panic() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this._request(endpoints.remoteAction, {
                gen: 2,
                regId: this.vin,
                service: 'horn'
            });
            return {
                result: response.RESPONSE_STRING,
                status: response.E_IFRESULT,
                errorMessage: response.E_IFFAILMSG
            };
        });
    }
    health() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this._request(endpoints.health, {
                service: 'getRecMaintenanceTimeline'
            });
            return {
                result: response.RESPONSE_STRING,
                status: response.E_IFRESULT,
                errorMessage: response.E_IFFAILMSG
            };
        });
    }
    apiUsageStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this._request(endpoints.usageStats, {
                startdate: 20140401,
                enddate: 20190611,
                service: 'getUsageStats'
            });
            return {
                result: response.RESPONSE_STRING.OUT_DATA,
                status: response.E_IFRESULT,
                errorMessage: response.E_IFFAILMSG
            };
        });
    }
    messages() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this._request(endpoints.messageCenter, {
                service: 'messagecenterservices'
            });
            return {
                result: response.RESPONSE_STRING.results,
                status: response.E_IFRESULT,
                errorMessage: response.E_IFFAILMSG
            };
        });
    }
    accountInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this._request(endpoints.myAccount, {
                service: 'getOwnerInfoDashboard'
            });
            return {
                result: response.RESPONSE_STRING,
                status: response.E_IFRESULT,
                errorMessage: response.E_IFFAILMSG
            };
        });
    }
    features() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this._request(endpoints.enrollmentStatus, {
                service: 'getEnrollment'
            });
            return {
                result: response.FEATURE_DETAILS.featureDetails,
                status: response.E_IFRESULT,
                errorMessage: response.E_IFFAILMSG
            };
        });
    }
    serviceInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this._request(endpoints.myAccount, {
                service: 'getOwnersVehiclesInfoService'
            });
            return {
                result: response.OwnerInfo,
                status: response.E_IFRESULT,
                errorMessage: response.E_IFFAILMSG
            };
        });
    }
    pinStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this._request(endpoints.myAccount, {
                service: 'getpinstatus'
            });
            return {
                result: response.RESPONSE_STRING,
                status: response.E_IFRESULT,
                errorMessage: response.E_IFFAILMSG
            };
        });
    }
    subscriptionStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this._request(endpoints.subscriptions, {
                service: 'getproductCatalogDetails'
            });
            return {
                result: response.RESPONSE_STRING.OUT_DATA.PRODUCTCATALOG,
                status: response.E_IFRESULT,
                errorMessage: response.E_IFFAILMSG
            };
        });
    }
    status(refresh = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this._request(endpoints.status, {
                services: 'getVehicleStatus',
                gen: 2,
                regId: this.vin,
                refresh: refresh // I think this forces the their API to connect to the vehicle and pull the status
            });
            return {
                result: response.RESPONSE_STRING.vehicleStatus,
                status: response.E_IFRESULT,
                errorMessage: response.E_IFFAILMSG
            };
        });
    }
    _request(endpoint, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // handle token refresh if we need to
            yield this._bluelinky.handleTokenRefresh();
            const merged = Object.assign({
                vin: this.vin,
                username: this._bluelinky.username,
                pin: this._pin,
                url: 'https://owners.hyundaiusa.com/us/en/page/dashboard.html',
                token: this._bluelinky.accessToken
            }, data);
            const formData = buildFormData(merged);
            const response = yield got(endpoint, {
                method: 'POST',
                body: formData,
            });
            try {
                return JSON.parse(response.body);
            }
            catch (e) {
                return null;
            }
        });
    }
}
class BlueLinky {
    constructor(authConfig) {
        this.authConfig = {
            username: null,
            password: null
        };
        this._accessToken = null;
        this._tokenExpires = null;
        this._vehicles = [];
        this.authConfig = authConfig;
    }
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.getToken();
            const expires = Math.floor((+new Date() / 1000) + parseInt(response.expires_in, 10));
            this.accessToken = response.access_token;
            this.tokenExpires = expires;
        });
    }
    get accessToken() {
        return this._accessToken;
    }
    set accessToken(token) {
        this._accessToken = token;
    }
    set tokenExpires(unixtime) {
        this._tokenExpires = unixtime;
    }
    get tokenExpires() {
        return this._tokenExpires || 0;
    }
    get username() {
        return this.authConfig.username;
    }
    getVehicles() {
        return this._vehicles;
    }
    getVehicle(vin) {
        return this._vehicles.find(item => vin === item.vin);
    }
    registerVehicle(vin, pin) {
        if (!this.getVehicle(vin)) {
            const vehicle = new Vehicle({
                vin: vin,
                pin: pin,
                token: this.accessToken,
                bluelinky: this
            });
            this._vehicles.push(vehicle);
            return new Promise((resolve, reject) => {
                vehicle.eventEmitter.on('ready', () => resolve(vehicle));
            });
        }
        return Promise.resolve(null);
    }
    // I think this would be good enough as teh vehcile class will check when the token expires before doing a request
    // if it is at or over the time it should tell it's dad to get a new token
    handleTokenRefresh() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTime = Math.floor((+new Date() / 1000));
            // refresh 60 seconds before timeout
            if (currentTime >= (this.tokenExpires - 60)) {
                console.log('token is expired, refreshing access token');
                yield this.getToken();
            }
        });
    }
    getToken() {
        return __awaiter(this, void 0, void 0, function* () {
            let response;
            const now = Math.floor(+new Date() / 1000);
            response = yield got(endpoints.getToken + now, {
                method: 'GET',
                json: true
            });
            const csrfToken = response.body.token;
            response = yield got(endpoints.validateToken, {
                method: 'GET',
                headers: {
                    Cookie: `csrf_token=${csrfToken};`
                }
            });
            const formData = buildFormData({
                ':cq_csrf_token': csrfToken,
                'username': this.authConfig.username,
                'password': this.authConfig.password,
                'url': 'https://owners.hyundaiusa.com/us/en/index.html'
            });
            response = yield got(endpoints.auth, {
                method: 'POST',
                body: formData
            });
            const json = JSON.parse(response.body);
            return json.Token;
        });
    }
}

module.exports = BlueLinky;
