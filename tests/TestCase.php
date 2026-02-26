<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Event;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        
        // Fake events for tests (broadcasting will use log driver in tests)
        Event::fake();
        
        // Set broadcast driver to log for tests to avoid WebSocket issues
        config(['broadcasting.default' => 'log']);
    }
}
