<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * One line of the audit log, e.g. "System Administrator confirmed booking RNG-20261012-0004".
 * Write entries with ActivityLog::record(...).
 */
class ActivityLog extends Model
{
    /** @var list<string> */
    protected $fillable = ['user_id', 'action', 'subject_type', 'subject_id', 'description'];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return MorphTo<Model, $this> */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Add an entry. The actor defaults to whoever is logged in; pass null
     * (and run outside a request) for things the system did by itself.
     */
    public static function record(string $action, string $description, ?Model $subject = null, ?User $actor = null): self
    {
        return self::create([
            'user_id' => $actor->id ?? auth()->id(),
            'action' => $action,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            'description' => $description,
        ]);
    }
}
