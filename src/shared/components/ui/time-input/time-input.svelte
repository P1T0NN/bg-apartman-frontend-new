<script lang="ts">
    // COMPONENTS
    import { Input } from '@/shared/components/ui/input/index.js';

    let { id }: { id: string } = $props();
</script>

<Input
    type="time"
    id="{id}-time"
    step="1"
    value="10:30:00"
    class="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
/>