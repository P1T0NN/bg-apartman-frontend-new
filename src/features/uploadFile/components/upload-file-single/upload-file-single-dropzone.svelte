<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';
</script>

<p class="text-sm text-muted-foreground">
	{m['UploadFile.UploadFileSingle.dropzoneDescription']()}
	<strong class="font-medium text-foreground">{m['UploadFile.UploadFileSingle.remove']()}</strong>
	{m['UploadFile.UploadFileSingle.or']()}
	<strong class="font-medium text-foreground">{m['UploadFile.UploadFileSingle.replace']()}</strong>
	{m['UploadFile.UploadFileSingle.ifYouChangeYourMind']()}
</p>
