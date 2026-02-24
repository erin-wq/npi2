<template>
    <div class="error-msg-wrap">
        <div class="error-msg">
            <div>{{msg}}</div>
            <div class="side-btns">
                <div @click="cancel()" class="btn btn-invert" style="margin-right: 10px;">Cancel</div>
                <div @click="confirm()" class="btn" style="margin-left: 10px;">Yes</div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
    name: 'ConfirmDelete',
    props: ['msg'],
    methods: {
        cancel() {
            this.$emit('cancel');
        },
        confirm() {
            this.$emit('confirm');
        }
    }
})
</script>