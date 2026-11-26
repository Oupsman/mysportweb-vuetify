<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { mdiCommentOutline, mdiDeleteOutline, mdiPencilOutline } from '@mdi/js'
  import { useSocialStore } from '@/stores/social'
  import type { Comment } from '@/types/social'
  import { MAX_COMMENT_LENGTH } from '@/types/social'

  // the comments of an activity: the user comments it, changes and deletes theirs; the owner of the activity
  // and the admins delete any. It loads the cheers with them, for ActivityCheer.
  const props = defineProps<{ activityId: string }>()

  const socialStore = useSocialStore()
  const comments = computed(() => socialStore.social?.comments ?? [])
  const open = computed(() => socialStore.social?.can_comment ?? false)
  const isOwner = computed(() => socialStore.social !== null && !socialStore.social.can_cheer)
  // closed to comments and none: nothing to show the others
  const shown = computed(() => socialStore.social === null || open.value || isOwner.value || comments.value.length > 0)
  const error = ref('')
  const busy = ref(false)
  const draft = ref('')
  const editing = ref<string | null>(null)
  const editDraft = ref('')

  const load = async () => {
    error.value = ''
    try {
      await socialStore.load(props.activityId)
    } catch (e) {
      error.value = (e as Error).message
    }
  }
  onMounted(load)
  watch(() => props.activityId, () => {
    draft.value = ''
    editing.value = null
    load()
  })

  const run = async (action: () => Promise<void>): Promise<boolean> => {
    error.value = ''
    busy.value = true
    try {
      await action()
      return true
    } catch (e) {
      error.value = (e as Error).message
      return false
    } finally {
      busy.value = false
    }
  }

  const tooLong = (text: string) => text.trim().length > MAX_COMMENT_LENGTH
  const post = async () => {
    if (await run(() => socialStore.comment(draft.value))) {
      draft.value = ''
    }
  }
  const startEdit = (comment: Comment) => {
    editing.value = comment.id
    editDraft.value = comment.body
  }
  const saveEdit = async (comment: Comment) => {
    if (await run(() => socialStore.editComment(comment.id, editDraft.value))) {
      editing.value = null
    }
  }
  const remove = (comment: Comment) => {
    const whose = comment.mine ? 'your comment' : `the comment of ${comment.author.username}`
    if (confirm(`Delete ${whose}?`)) {
      run(() => socialStore.deleteComment(comment.id))
    }
  }

  const when = (date: string) => new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))
  // changed a while after it was posted: a quick fix of a typo doesn't count
  const edited = (comment: Comment) =>
    new Date(comment.updated_at).getTime() - new Date(comment.created_at).getTime() > 60_000
</script>

<template>
  <v-card v-if="shown">
    <v-card-item>
      <template #prepend>
        <v-icon color="primary" :icon="mdiCommentOutline" />
      </template>
      <v-card-title>Comments{{ comments.length > 0 ? ` (${comments.length})` : '' }}</v-card-title>
    </v-card-item>
    <v-card-text>
      <v-alert
        v-if="error"
        class="mb-3"
        closable
        density="compact"
        type="error"
        variant="tonal"
        @click:close="error = ''"
      >{{ error }}</v-alert>

      <div v-for="comment in comments" :key="comment.id" class="comment mb-4">
        <div class="d-flex align-center">
          <strong>{{ comment.author.username }}</strong>
          <span class="text-caption text-medium-emphasis ml-2">
            {{ when(comment.created_at) }}{{ edited(comment) ? ' · edited' : '' }}
          </span>
          <v-spacer />
          <v-btn
            v-if="open && comment.mine && editing !== comment.id"
            density="comfortable"
            :disabled="busy"
            :icon="mdiPencilOutline"
            size="small"
            title="Change"
            variant="text"
            @click="startEdit(comment)"
          />
          <v-btn
            v-if="comment.can_delete"
            density="comfortable"
            :disabled="busy"
            :icon="mdiDeleteOutline"
            size="small"
            title="Delete"
            variant="text"
            @click="remove(comment)"
          />
        </div>
        <template v-if="editing === comment.id">
          <v-textarea
            v-model="editDraft"
            auto-grow
            class="mt-1"
            :counter="MAX_COMMENT_LENGTH"
            density="compact"
            rows="2"
          />
          <div class="d-flex ga-2">
            <v-btn
              color="primary"
              :disabled="!editDraft.trim() || tooLong(editDraft)"
              :loading="busy"
              size="small"
              @click="saveEdit(comment)"
            >Save</v-btn>
            <v-btn size="small" variant="text" @click="editing = null">Cancel</v-btn>
          </div>
        </template>
        <!-- text interpolation: the comment is never HTML -->
        <div v-else class="body">{{ comment.body }}</div>
      </div>

      <template v-if="open">
        <v-textarea
          v-model="draft"
          auto-grow
          :counter="MAX_COMMENT_LENGTH"
          density="compact"
          hide-details="auto"
          label="Add a comment"
          rows="2"
        />
        <v-btn
          class="mt-2"
          color="primary"
          :disabled="!draft.trim() || tooLong(draft)"
          :loading="busy"
          @click="post"
        >Post</v-btn>
      </template>
      <p v-else-if="isOwner" class="text-body-2 text-medium-emphasis">
        Comments are off on this activity: tick "Comments allowed" on its
        <router-link :to="`/activity/${activityId}/edit`">edit page</router-link> to let the others comment.
      </p>
      <p v-else class="text-body-2 text-medium-emphasis">Comments are off on this activity.</p>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="sass">
.body
  white-space: pre-wrap
  overflow-wrap: anywhere
</style>
