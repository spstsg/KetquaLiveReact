import React from 'react';
import {
    TouchableOpacity,
    StyleSheet,
    Text,
    Image,
    View, AsyncStorage
} from 'react-native';
import {getAppPropMap, getAppStateMap} from "../../common/common.map";
import {connect} from 'react-redux';
import styles from '../styles/LoginStyle';
import {loginFacebookClicked, loginNormalClicked, loginNormalSuccess} from "../profile.actions";
import {CONFIG} from "../../common/common.constants";
import IconLoading from "../../common/components/IconLoading";
import {call, put} from "redux-saga/effects";
import {getUserCodeAPI} from "../api/GetNewUserCodeAPI";
import {loginAPI, fbloginAPI} from "../api/LoginAPI";
import * as Facebook from 'expo-facebook';

const initialState = {
    loading: false
};

class LoginScreen extends React.Component {

    constructor(props) {
        super(props);
        this.state = initialState;
    }

    login = async () => {
        this.setState({loading: true});
        try {
            let code = AsyncStorage.getItem('code');
            if(!code || typeof code !== "string"){
                const phone_number = AsyncStorage.getItem('phone');
                const verify_code = AsyncStorage.getItem('verify_code');
                code = await getUserCodeAPI(phone_number, verify_code);
            }
            const user = await loginAPI(code);
            if(user){
                this.props.loginSuccess(user);
                await AsyncStorage.setItem('code', user.code);
                this.props.navigation.navigate('App');
            }else{
                alert("Tạm thời không đăng nhập được");
                this.setState({loading: false});
            }
        } catch (error) {
            console.error(error);
        }
    };

    facebookLogIn = async () => {
        try {
          await Facebook.initializeAsync('727625241152278');
          const {
            type,
            token,
            expires,
            permissions,
            declinedPermissions,
          } = await Facebook.logInWithReadPermissionsAsync({
            permissions: ['public_profile','email'],
          });
          if (type === 'success') {
            // Get the user's name using Facebook's Graph API
            const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email,birthday&access_token=${token}`);
            //const response = await fetch(`https://graph.facebook.com/me?access_token=${token}`);
            const user = await fbloginAPI(await response.json());
            if(user){
                this.props.loginSuccess(user);
                await AsyncStorage.setItem('code', user.code);
                this.props.navigation.navigate('App');
            }else{
                alert("Tạm thời không đăng nhập được");
                this.setState({loading: false});
            }
          } else {
            // type === 'cancel'
          }
        } catch ({ message }) {
          alert(`Facebook Login Error: ${message}`);
        }
      }

    render() {
        return (
            <View style={styles.container}>
                <View style={styles.login_form}>
                    <Image source={require('../../../assets/images/icon.png')} style={styles.app_icon} />
                    <Text style={styles.app_name}>{CONFIG.name}</Text>
                    <Text style={styles.app_slogan}>{CONFIG.slogan}</Text>
                    <TouchableOpacity onPress={this.login} style={styles.login_button}>
                        {this.state.loading?<IconLoading />:<Text style={styles.login_button_text}>Đăng nhập</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.loginBtn} onPress={this.facebookLogIn}>
                        <Text style={{ color: "#fff" }}>Login with Facebook</Text>
                    </TouchableOpacity>
                    <View style={styles.hotline}>
                        <Text style={styles.hotline_label}>Hotline: </Text>
                        <TouchableOpacity onPress={() => this.props.callHotline()}><Text style={styles.hotline_text}>{CONFIG.hotline}</Text></TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        ...getAppStateMap(state)
    }
};

const mapDispatchToProps = (dispatch) => {
    return {
        ...getAppPropMap(dispatch),
        loginNormal: (navigator) => {
            dispatch(loginNormalClicked(navigator));
        },
        loginFacebook: (navigator) => {
            dispatch(loginFacebookClicked(navigator));
        },
        loginSuccess: (user) => {
            dispatch(loginNormalSuccess(user));
        }
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(LoginScreen);