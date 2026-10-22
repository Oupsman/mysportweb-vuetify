<script setup lang="ts">
  import { mdiEye, mdiEyeOff, mdiLock } from '@mdi/js'
  import { useUserStore } from '@/stores/user'
  import { useAppStore } from '@/stores/app'
  import { useVuelidate } from '@vuelidate/core'
  import { minLength, required, sameAs } from '@vuelidate/validators'

  const userStore = useUserStore()
  const appStore = useAppStore()

  const isLoading = ref(true)
  const showPassword = ref(false)

  const userForm = ref({
    oldPassword: '',
    newPassword: '',
    newPasswordConfirmation: '',
    birthmonth: 1,
    birthday: 1,
    birthyear: 2000,
    gender: 0,
    weight: 0,
    height: 0,
    max_hr: 170,
    security_distance: 500,
    timezone: '',
  })

  const rules = computed(() => ({
    oldPassword: { required },
    newPassword: { minLength: minLength(6) },
    newPasswordConfirmation: {
      sameAsPassword: sameAs(userForm.value.newPassword),
    },
  }))

  const v$ = useVuelidate(rules, userForm)

  const user = ref(null)
  const months = [...Array(12)].map((_, i) => ({ value: i + 1, title: (i + 1).toString() }))
  const days = [...Array(31)].map((_, i) => ({ value: i + 1, title: (i + 1).toString() }))
  const currentYear = new Date().getFullYear()
  const years = [...Array(101)].map((_, i) => ({ value: currentYear - i, title: (currentYear - i).toString() }))
  // the browser's timezones, the backend checks the chosen one
  const timezones = Intl.supportedValuesOf('timeZone')
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const genders = [
    { title: 'Male', value: 0 },
    { title: 'Female', value: 1 },
  ]

  const fetchUser = async () => {
    try {
      isLoading.value = true
      await userStore.getUser()
      user.value = userStore.user
      if (user.value?.date_of_birth) {
        const date = new Date(user.value.date_of_birth)
        userForm.value.birthmonth = date.getMonth() + 1
        userForm.value.birthday = date.getDate()
        userForm.value.birthyear = date.getFullYear()
      }
      if (user.value) {
        appStore.pageTitle = user.value.username
        Object.assign(userForm.value, user.value)
        // accounts created without one: suggest the browser's, saved with the form
        userForm.value.timezone ||= browserTimezone
      }
    } catch (error) {
      console.error('Error while loading user', error)
    } finally {
      isLoading.value = false
    }
  }

  onMounted(fetchUser)

  const save = async () => {
    const isValid = await v$.value.$validate()
    if (!isValid) return

    const dateOfBirth = new Date(`${userForm.value.birthyear}/${userForm.value.birthmonth}/${userForm.value.birthday}`)
    const updatedUser = {
      ...userForm.value,
      date_of_birth: dateOfBirth.toISOString(),
    }
    await userStore.updateUser(updatedUser)
  }
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="user">
    <v-container>
      <v-form @submit.prevent="save">
        <v-text-field
          v-model="userForm.oldPassword"
          :append-inner-icon="showPassword ? mdiEyeOff : mdiEye"
          :error-messages="v$.oldPassword.$errors.map(e => unref(e.$message))"
          label="Current Password"
          :prepend-icon="mdiLock"
          required
          :type="showPassword ? 'text' : 'password'"
          @click:append-inner="showPassword = !showPassword"
        />
        <v-text-field
          v-model="userForm.newPassword"
          :append-inner-icon="showPassword ? mdiEyeOff : mdiEye"
          :error-messages="v$.newPassword.$errors.map(e => unref(e.$message))"
          label="New Password"
          :prepend-icon="mdiLock"
          :type="showPassword ? 'text' : 'password'"
          @click:append-inner="showPassword = !showPassword"
        />
        <v-text-field
          v-model="userForm.newPasswordConfirmation"
          :append-inner-icon="showPassword ? mdiEyeOff : mdiEye"
          :error-messages="v$.newPasswordConfirmation.$errors.map(e => unref(e.$message))"
          label="Confirm Password"
          :prepend-icon="mdiLock"
          :type="showPassword ? 'text' : 'password'"
          @click:append-inner="showPassword = !showPassword"
        />
        <v-row>
          <v-select v-model="userForm.birthmonth" :items="months" label="Birth Month" />
          <v-select v-model="userForm.birthday" :items="days" label="Birth day" />
          <v-select v-model="userForm.birthyear" :items="years" label="Birth year" />
        </v-row>
        <v-select v-model="userForm.gender" :items="genders" label="Gender" />
        <v-text-field v-model.number="userForm.weight" label="Weight" type="number" />
        <v-text-field v-model.number="userForm.height" label="Height (cm)" type="number" />
        <v-text-field v-model.number="userForm.max_hr" label="Max HR" type="number" />
        <v-text-field v-model.number="userForm.security_distance" label="Security Distance (m)" type="number" />
        <v-autocomplete
          v-model="userForm.timezone"
          hint="Weeks, months and the time of the day in activity titles are in this timezone"
          :items="timezones"
          label="Timezone"
          persistent-hint
        />
        <v-btn color="primary" :disabled="v$.$invalid" type="submit">Save</v-btn>
      </v-form>
    </v-container>
  </div>
  <div v-else>User not found</div>
</template>
