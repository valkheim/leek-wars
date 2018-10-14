<template lang="html">
	<div id="header">
		<div id="header-left">
			<router-link to="/">
				<div id="logo-wrapper">
					<img class="logo" src="/image/logo.png">
					<span v-if="LeekWars.local" class="local-label">local</span>
					<span v-if="LeekWars.dev" class="dev-label">dev</span>
					<span v-if="LeekWars.beta" class="beta-label">Bêta</span>
				</div>
			</router-link>
		</div>
		<div id="header-right">
			<div v-if="!$store.getters.connected" id="header-signin" class="buttons">
				<div class="button-wrapper">
					<router-link to="/login">
						<div id="login-button" class="header-button">{{ $t('main.connection') }}</div>
					</router-link>
				</div><div class="button-wrapper">
					<router-link to="/">
						<div id="signup-button" class="header-button">{{ $t('main.signup') }}</div>
					</router-link>
				</div>
			</div>
			<div v-if="$store.getters.connected" id="header-farmer" class="buttons">
				<!-- <div class="button-wrapper">
					<div class="header-button" @click="LeekWars.setLocale($i18n.locale == 'fr' ? 'en' : 'fr')">
						{{ $i18n.locale }}
					</div>
				</div> -->
				<div class="button-wrapper">
					<router-link to="/bank">
						<div class="header-button">
							<span class="farmer-crystals text">{{ $store.state.farmer.crystals }}</span>
							&nbsp;<span class="crystal text"></span>
						</div>
					</router-link>
				</div>
				<div class="button-wrapper">
					<router-link to="/market">
						<div class="header-button">
							<span class="farmer-habs text">{{ $store.state.farmer.habs | number }}</span>
							&nbsp;<span class="hab text"></span>
						</div>
					</router-link>
				</div>
				<div class="button-wrapper">
					<router-link to="/garden">
						<div class="header-button fights-button">
							<span class="farmer-fights text">{{ $store.state.farmer.fights | number }}</span>
							&nbsp;<img src="/image/icon/garden.png">
						</div>
					</router-link>
				</div>
				<div class="button-wrapper">
					<div class="header-button messages-button">
						<i class="material-icons">email</i>
						<span v-show="$store.state.unreadMessages > 0" class="counter">{{ $store.state.unreadMessages }}</span>
					</div>
				</div>
				<div class="button-wrapper">
					<v-menu :close-on-content-click="false" :nudge-bottom="5" :min-width="400" :max-width="400" :max-height="400" bottom offset-y @input="readNotifications">
						<div slot="activator" class="header-button notifications-button">
							<i class="material-icons">notifications</i>
							<span v-show="$store.state.unreadNotifications > 0" class="counter">{{ $store.state.unreadNotifications }}</span>
						</div>
						<div class="dialog">
							<div class="dialog-items">
								<notification v-for="notification in $store.state.notifications" :key="notification.id" :notification="notification" @click.native="readNotification(notification)" />
							</div>
							<router-link to="/notifications" class="see-all">{{ $t('main.all_notifications') }}</router-link>
						</div>
					</v-menu>
				</div>
				<div class="button-wrapper">
					<router-link to="/settings">
						<div id="settings-button" class="header-button">
							<i class="material-icons">settings</i>
						</div>
					</router-link>
				</div>
				<div class="button-wrapper">
					<router-link to="/farmer">
						<div class="header-button">
							<span class="farmer-name text">{{ $store.state.farmer.name }}</span>
							<avatar :farmer="$store.state.farmer" />
						</div>
					</router-link>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Notification } from '@/model/notification'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({ name: 'lw-header' })
	export default class Header extends Vue {
		readNotification(notification: Notification) {
			LeekWars.post('notification/read', {notification_id: notification.id})
		}
		readNotifications() {
			if (this.$store.state.unreadNotifications) {
				LeekWars.post('notification/read-all')
				this.$store.commit('read-notifications')
			}
		}
	}
</script>

<style lang="scss" scoped>
	.logo {
		width: 100%;
		max-width: 320px;
		max-height: 45px;
		margin: 0px;
		margin-top: 15px;
		margin-bottom: 10px;
	}
	.avatar {
		height: 42px;
		width: 42px;
		margin-left: 8px;
		margin-right: -4px;
	}
	.header-button i {
		line-height: 42px;
	}
	#header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		height: 80px;
	}
	#header .fights-button img {
		height: 20px;
		width: 20px;
		margin: -4px 0;
		opacity: 0.8;
	}
	#header-left {
		padding-right: 20px;
	}
	#logo-wrapper {
		white-space: nowrap;
	}
	#header .buttons {
		padding-bottom: 4px;
		display: flex;
	}
	#header .button-wrapper {
		flex-grow: 1;
	}
	#header .header-signin {
		padding-bottom: 5px;
		text-align: right;
	}
	#header .header-button {
		display: inline-block;
		cursor: pointer;
		text-align: center;
		padding: 0 4px;
		line-height: 42px;
		font-size: 17px;
		height: 42px;
		vertical-align: top;
		margin-left: 25px;
		color: #eee;
		position: relative;
		background: rgba(80, 80, 80, 0.6);
		vertical-align: bottom;
		white-space: nowrap;
	}
	#header .button-wrapper:first-child .header-button {
		margin-left: 0;
	}
	#header-farmer .button-wrapper:first-child .header-button {
		padding-left: 10px;
	}
	#header-signin .button-wrapper:last-child .header-button {
		padding-right: 12px;
	}
	#header .header-button .text,
	#header-mobile .header-button .text {
		line-height: 42px;
		height: 42px;
		display: inline-block;
		vertical-align: top;
	}
	#header-mobile .header-button .text {
		font-size: 16px;
		line-height: 50px;
		height: 50px;
	}
	#header .header-button .crystal {
		vertical-align: bottom;
		margin-bottom: -1px;
	}
	#signup-button {
		padding-right: 20px;
	}
	.header-button:not(.mobile):before {
		content: "";
		position: absolute;
		left: -20px;
		top: 0;
		width: 0;
		height: 0;
		border-style: solid;
		border-width: 0 0 42px 20px;
		border-color: transparent transparent rgba(80, 80, 80, 0.6) transparent;
	}
	.header-button:not(.mobile):after {
		content: "";
		position: absolute;
		right: -20px;
		top: 0;
		width: 0;
		height: 0;
		z-index: -1;
		border-style: solid;
		border-width: 42px 20px 0 0;
		border-color: rgba(80, 80, 80, 0.6) transparent transparent transparent;
	}
	#header .button-wrapper:last-child .header-button:after {
		border: none;
	}
	#header .header-button:hover {
		background: rgba(200, 200, 200, 0.4);
	}
	#header .header-button:hover:before {
		border-color: transparent transparent rgba(200, 200, 200, 0.4) transparent;
	}
	#header .header-button:hover:after {
		border-color: rgba(200, 200, 200, 0.4) transparent transparent transparent;
	}
	.farmer-avatar {
		height: 42px;
		width: 42px;
		margin-left: 8px;
		margin-right: -4px;
	}
	#settings-button img, .notifications-button img, .messages-button img {
		height: 26px;
		width: 26px;
		margin: 8px 0;
		opacity: 0.8;
	}
	.messages-button,
	.notifications-button {
		position: relative;
	}
	.counter {
		position: absolute;
		top: -2px;
		right: -6px;
		background: #5FAD1B;
		padding: 4px 5px;
		color: white;
		border-radius: 5px;
		height: 12px;
		line-height: 12px;
	}
	.dialog {
		background: #f2f2f2;
	}
	.dialog-items {
		max-height: 350px;
		overflow-y: auto;
	}
	.see-all {
		padding: 8px;
		display: block;
		text-align: center;
		color: #777;
	}
	.see-all:hover {
		background: white;
	}
</style>