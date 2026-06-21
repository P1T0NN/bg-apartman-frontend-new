<script lang="ts">
    // LIBRARIES
    import { m } from "@/shared/lib/paraglide/messages";
</script>

<p class="text-muted-foreground text-sm">
    {m['UploadFile.UploadFileSingle.dropzoneDescription']()}
    <strong class="text-foreground font-medium">{m['UploadFile.UploadFileSingle.remove']()}</strong> {m['UploadFile.UploadFileSingle.or']()}
    <strong class="text-foreground font-medium">{m['UploadFile.UploadFileSingle.replace']()}</strong> {m['UploadFile.UploadFileSingle.ifYouChangeYourMind']()}
</p>