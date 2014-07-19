superintendent
==============

## Introduction

Orchestrating tasks expressed as functions - playing with ideas for the future Gulp task system. The idea here is to
experiment with tasks-as-functions idea expressed here: https://github.com/gulpjs/gulp/issues/355#issuecomment-45052782

In a nutshell we would like to have task dependencies expressed as (asynchronous) functions, instead of tasks as of today.
It would make it possible to covert today's code:

```javascript
gulp.task('foo', function(done) {
    //do something foo-lish here
    done();
});

gulp.task('bar', function(done) {
    //do something bar-ish here
    done();
});

gulp.task('default', ['foo', 'bar'], function(done) {
    // do something when 'foo' and 'bar' are done
});
```

into:

```javascript
function foo(done) {
    //do something foo-lish here
    done();
}

function bar(done) {
    //do something bar-ish here
    done();
};

gulp.task('default', gulp.parallel(foo, bar) , function(done) {
    // do something when 'foo' and 'bar' are done
});
```

or, if you prefer to have `foo` and `bar` being executed in a sequence:

```javascript
gulp.task('default', gulp.series(foo, bar) , function(done) {
    // do something when 'foo' and 'bar' are done
});
```

Obviously one should be able to combine the `parallel` and `series` calls, ex.:

```javascript
gulp.task('default', gulp.series(foo, gulp.parallel(bar, baz) , function(done) {
    // do something when 'foo' and 'bar' and 'baz' are done
});
```

Such approach has several advantages over the current system:
* it is possible to precisely control order of execution of dependent tasks
* a set of dependent tasks to be executed could be built dynamically
* using function dependencies instead of tasks make it possible to define / expose only tasks that make sense for the users; in a way those functions can act as "private tasks".

## Spec

A discussion about a new task system for Gulp4 is scattered over several GitHub repositories and issues. I would love to
centralise this discussion and open it up to the community for discussion.

### Different ways of specifying dependencies

* `gulp.task('default', [], function() {}))` - should work as of today
* `gulp.task('default', ['foo', 'bar'], function() {}))` - where `foo` and `bar` are tasks should work as of today
* `gulp.task('default', gulp.parallel('foo', 'bar'), function() {}))` - where `foo` and `bar` are tasks should be equivalent to the above
* `gulp.task('default', gulp.parallel(foo, bar), function() {}))` - where `foo` and `bar` are function references
* `gulp.task('default', gulp.series(foo, bar), function() {}))` - where `foo` and `bar` are function references

### Asynchronous functions that can be combined

The `gulp.parallel` and `gulp.series` arguments should accept any asynchronous functions. The end-of-processing for a
 given function can be expressed be:
 * synchronously returning a value / throwing an exception
 * invoking a provided callback
 * returning a promise
 * returning a stream
 * it would be really easy to extend it to other node-async processing patterns (process, http request etc.)

## Implementation

This repo contains a minimal, non-production ready implementation of a promise-based functions dependency system that
could potentially replace the current task orchestration system.

There is a separate repository containing a POC for a minimal gulp implementation based on this function orchestration.